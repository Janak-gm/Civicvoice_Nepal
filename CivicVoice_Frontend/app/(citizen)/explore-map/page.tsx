'use client'

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { categories } from "@/lib/data"
import { formatCount, statusLabel } from "@/lib/utils"
import { getFeed } from "@/lib/api"
import type { FeedReport } from "@/lib/api"

const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' }
const statusColors: Record<string, string> = { open: '#EF4444', in_review: '#D97706', progress: '#D97706', resolved: '#059669' }
const statusBadgeBg: Record<string, string> = { open: '#FEE2E2', in_review: '#FEF3C7', progress: '#FEF3C7', resolved: '#D1FAE5' }

interface LocalPost {
  id: number
  author: string
  date: string
  status: string
  priority: string
  category: string
  ward: number
  location: string
  title: string
  body: string
  likes: number
  comments: number
  lat: number | null
  lng: number | null
}

function toLocalPost(r: FeedReport): LocalPost {
  const d = new Date(r.created_at)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return {
    id: r.id,
    author: r.citizen_name,
    date: dateStr,
    status: r.status,
    priority: 'medium',
    category: r.category,
    ward: r.ward_number,
    location: r.address,
    title: r.title,
    body: r.description,
    likes: r.total_upvotes,
    comments: r.total_comments,
    lat: r.latitude ? parseFloat(r.latitude) : null,
    lng: r.longitude ? parseFloat(r.longitude) : null,
  }
}

export default function ExploreMapPage() {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [boundaries, setBoundaries] = useState(true)
  const [allPosts, setAllPosts] = useState<LocalPost[]>([])
  const [listPosts, setListPosts] = useState<LocalPost[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const mapElRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersLayer = useRef<any>(null)
  const boundaryLayer = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)

    getFeed({})
      .then(res => {
        if (cancelled) return
        const mapped = res.results.map(toLocalPost)
        setAllPosts(mapped)
        setLoadingData(false)
      })
      .catch(() => {
        if (cancelled) return
        setAllPosts([])
        setLoadingData(false)
      })

    return () => { cancelled = true }
  }, [])

  const filterPosts = useCallback(() => {
    let list = allPosts.filter(p => p.lat && p.lng)
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        `ward ${p.ward}`.includes(q)
      )
    }
    if (catFilter !== 'all') list = list.filter(p => p.category === catFilter)
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(p => p.priority === priorityFilter)
    if (dateFilter === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > monthAgo)
    } else if (dateFilter === '3months') {
      const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.date).getTime() > threeMonthsAgo)
    }
    setListPosts(list)
  }, [search, catFilter, statusFilter, priorityFilter, dateFilter, allPosts])

  useEffect(() => {
    const timer = setTimeout(filterPosts, 200)
    return () => clearTimeout(timer)
  }, [filterPosts])

  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapElRef.current || mapInstance.current) return
    const L = (window as any).L
    const map = L.map(mapElRef.current).setView([27.7172, 85.3240], 13)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    })
    streetLayer.addTo(map)
    L.control.layers({ Street: streetLayer, Satellite: satelliteLayer }, null, { position: 'bottomleft' }).addTo(map)
    mapInstance.current = map
    markersLayer.current = L.layerGroup().addTo(map)

    fetch('/kmc_wards.geojson')
      .then(r => r.json())
      .then(data => {
        const layer = L.geoJSON(data, {
          style: { color: '#2563EB', weight: 2.5, fillColor: '#2563EB', fillOpacity: 0.1 },
          onEachFeature: (feature: any, layer: any) => {
            const wardNum = feature.properties.ward
            if (wardNum) {
              layer.bindTooltip(`Ward ${wardNum}`, { permanent: true, direction: 'center', className: 'ward-label' })
            }
          },
        })
        boundaryLayer.current = layer
        if (boundaries) {
          layer.addTo(map)
          map.fitBounds(layer.getBounds(), { padding: [20, 20] })
        }
      })
      .catch(() => {})

    return () => {
      map.remove()
      mapInstance.current = null
      markersLayer.current = null
      boundaryLayer.current = null
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return
    const L = (window as any).L
    const layer = markersLayer.current
    layer.clearLayers()

    listPosts.forEach(p => {
      const lat = p.lat
      const lng = p.lng
      if (lat == null || lng == null) return
      const color = statusColors[p.status] || '#EF4444'
      const sLabel = statusLabel(p.status)
      const icon = L.divIcon({
        className: '',
        html: `<div class="mv-marker" style="color:${color}"><div class="mv-marker-pulse"></div><div class="mv-marker-inner"></div></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      })
      L.marker([lat, lng], { icon })
        .addTo(layer)
        .bindPopup(`
          <div class="mv-popup">
            <div class="mv-popup-header">
              <span class="mv-popup-status" style="background:${statusBadgeBg[p.status] || '#FEE2E2'};color:${color}">${sLabel}</span>
              <span class="mv-popup-priority">${priorityLabels[p.priority] || ''}</span>
            </div>
            <strong class="mv-popup-title">${p.title}</strong>
            <div class="mv-popup-meta">${p.location} &middot; Ward ${p.ward} &middot; ${p.date}</div>
            <div class="mv-popup-body">${p.body}</div>
            <div class="mv-popup-footer">
              <span>${formatCount(p.likes)} likes &middot; ${formatCount(p.comments)} comments</span>
              <a class="mv-popup-link" href="/report-details/${p.id}">View Details</a>
            </div>
          </div>
        `)
    })
  }, [listPosts])

  useEffect(() => {
    if (!mapInstance.current || !boundaryLayer.current) return
    if (boundaries) {
      mapInstance.current.addLayer(boundaryLayer.current)
    } else {
      mapInstance.current.removeLayer(boundaryLayer.current)
    }
  }, [boundaries])

  useEffect(() => {
    if (view === 'map' && mapInstance.current) {
      setTimeout(() => mapInstance.current.invalidateSize(), 200)
    }
  }, [view])

  return (
    <div id="mapView" style={{ display: 'block' }}>
      <div className="mv-inner">
        <section className="mv-hero">
          <div className="mv-hero-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            Explore Map
          </div>
          <h1>Issue Map <span>Kathmandu</span></h1>
          <p>Browse civic issues across the Kathmandu Metropolitan City. Click on markers to see report details.</p>
        </section>
        <div className="mv-search-row">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.3" y1="16.3" x2="21" y2="21"/></svg>
          <input type="text" id="mvSearch" placeholder="Search location, ward, or issue..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="mv-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className="mv-filter-row">
          <select className="mv-select" id="mvCategoryFilter" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="mv-select" id="mvStatusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {['open', 'in_review', 'resolved'].map(s => (
              <option key={s} value={s}>{s === 'in_review' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select className="mv-select" id="mvPriorityFilter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            {Object.entries(priorityLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select className="mv-select" id="mvDateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="3months">Past 3 Months</option>
          </select>
        </div>
        <div className="mv-layer-row">
          <label className="mv-layer-label"><input type="checkbox" id="mvLayerBoundaries" checked={boundaries} onChange={e => setBoundaries(e.target.checked)} /> Ward Boundaries</label>
        </div>
        <div className="mv-view-toggle">
          <button className={`mv-toggle-btn${view === 'map' ? ' active' : ''}`} id="mvMapViewBtn" onClick={() => setView('map')}>Map View</button>
          <button className={`mv-toggle-btn${view === 'list' ? ' active' : ''}`} id="mvListViewBtn" onClick={() => setView('list')}>List View</button>
        </div>
        <div className="mv-map-wrap" id="mvMapWrap" style={{ display: view === 'map' ? '' : 'none' }}>
          <div className="mv-legend" id="mvLegend">
            <span><span className="mv-dot mv-dot-red"></span> Open</span>
            <span><span className="mv-dot mv-dot-orange"></span> In Review</span>
            <span><span className="mv-dot mv-dot-green"></span> Resolved</span>
          </div>
          <button className="mv-my-location-btn" id="mvMyLocationBtn" onClick={() => {
            if (mapInstance.current && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(pos => {
                mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 15)
              })
            }
          }} aria-label="My Location">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
          </button>
          <div id="exploreMap" ref={mapElRef} className="mv-map" style={{ minHeight: 400, background: 'var(--color-pill-bg)' }}>
            {!leafletLoaded && (
              <div className="mv-loading"><div className="mv-loading-spinner"></div><span>Loading map...</span></div>
            )}
            {leafletLoaded && !loadingData && listPosts.length === 0 && (
              <div className="mv-empty-msg">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8, opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <div>No issues match your filters.</div>
              </div>
            )}
          </div>
          <Link href="/submit" className="mv-fab" aria-label="Report an issue">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Report Issue
          </Link>
        </div>
        <div className="mv-list-wrap" id="mvListWrap" style={{ display: view === 'list' ? 'block' : 'none' }}>
          <div className="mv-list-inner" id="mvList">
            {loadingData ? (
              <div className="mv-list-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="mv-loading-spinner"></div>
                <div>Loading issues...</div>
              </div>
            ) : listPosts.length === 0 ? (
              <div className="mv-list-empty">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8, opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <div>No issues match your filters. Try adjusting your search or filter criteria.</div>
              </div>
            ) : (
              listPosts.map(p => (
                <div className="mv-list-card" key={p.id} data-id={p.id}>
                  <div className="mv-list-head">
                    <span className="mv-list-status" style={{ background: statusBadgeBg[p.status] || '#FEE2E2', color: statusColors[p.status] || '#EF4444' }}>{statusLabel(p.status)}</span>
                    <span className="mv-list-priority">{priorityLabels[p.priority] || ''}</span>
                  </div>
                  <div className="mv-list-title">{p.title}</div>
                  <div className="mv-list-meta">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {p.location} &middot; Ward {p.ward} &middot; {p.date}
                  </div>
                  <div className="mv-list-stats">
                    <span>{formatCount(p.likes)} likes</span>
                    <span>{formatCount(p.comments)} comments</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
