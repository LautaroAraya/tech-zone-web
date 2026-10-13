import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight, BadgeCheck, BatteryCharging, Camera, Check, ChevronLeft,
  ChevronRight, Clock3, Cpu, HardDrive, Instagram, Laptop, LockKeyhole,
  LogOut, Menu, MessageCircle, MonitorCog, Phone, Plus, Save, Settings,
  ShieldCheck, Smartphone, Trash2, UploadCloud, Wrench, X, MapPin
} from 'lucide-react';
import './style.css';

const envReady = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const supabase = envReady ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY) : null;

const defaultSettings = {
  business_name: 'Tech Zone',
  tagline: 'Tecnología en buenas manos',
  phone: '',
  whatsapp: '',
  instagram: '',
  address: 'San Justo, Santa Fe',
  hours: 'Consultar horarios',
  about: 'Reparamos tus equipos con atención personalizada, diagnóstico claro y soluciones pensadas para que vuelvas a estar conectado.'
};

const defaultServices = [
  { id: 'pc', title: 'PC y notebooks', description: 'Mantenimiento, limpieza interna, optimización, instalación de sistema y solución de fallas.', icon: 'laptop' },
  { id: 'screen', title: 'Cambio de módulo', description: 'Reemplazo de pantalla y módulo para celulares. Consultá disponibilidad según tu modelo.', icon: 'phone' },
  { id: 'battery', title: 'Baterías y carga', description: 'Cambio de batería, revisión de pin de carga y diagnóstico de problemas de alimentación.', icon: 'battery' },
  { id: 'hardware', title: 'Reparación de hardware', description: 'Diagnóstico de componentes, almacenamiento, memoria, conectores y otras fallas.', icon: 'cpu' }
];

const serviceIcons = { laptop: Laptop, phone: Smartphone, battery: BatteryCharging, cpu: Cpu };
const moneyless = (v) => (v || '').trim();

function App() {
  const [view, setView] = useState('client');
  const [settings, setSettings] = useState(defaultSettings);
  const [services, setServices] = useState(defaultServices);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(envReady);
  const [configured, setConfigured] = useState(envReady);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [slide, setSlide] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [newService, setNewService] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    loadPublicData();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadPublicData() {
    if (!supabase) return;
    setLoading(true);
    const [settingsRes, servicesRes, photosRes] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('site_services').select('*').eq('visible', true).order('created_at', { ascending: true }),
      supabase.from('site_photos').select('*').order('created_at', { ascending: false })
    ]);
    if (settingsRes.data) setSettings({ ...defaultSettings, ...settingsRes.data });
    if (servicesRes.data?.length) setServices(servicesRes.data);
    if (photosRes.data) setPhotos(photosRes.data);
    setLoading(false);
  }

  async function login(e) {
    e.preventDefault(); setLoginError(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setLoginError('No se pudo iniciar sesión. Revisá el correo y la contraseña.');
    else { setView('admin'); setNotice('Sesión iniciada.'); await loadPublicData(); }
  }

  async function logout() {
    await supabase.auth.signOut(); setSession(null); setView('client'); setNotice('Sesión cerrada.');
  }

  async function saveSettings(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    const payload = { id: 1, ...settings, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('site_settings').upsert(payload);
    setBusy(false);
    setNotice(error ? 'No se pudo guardar. Revisá la configuración de Supabase.' : 'Configuración guardada correctamente.');
  }

  async function uploadPhoto(e) {
    e.preventDefault();
    if (!photoFile) { setNotice('Elegí una imagen antes de publicar.'); return; }
    setBusy(true); setNotice('');
    const safeName = photoFile.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    const path = `${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('tech-zone-photos').upload(path, photoFile, { upsert: false });
    if (uploadError) {
      setBusy(false); setNotice('No se pudo subir la imagen. Revisá el bucket y sus permisos.'); return;
    }
    const { data: urlData } = supabase.storage.from('tech-zone-photos').getPublicUrl(path);
    const { error } = await supabase.from('site_photos').insert({
      title: moneyless(photoTitle) || 'Trabajo realizado',
      description: moneyless(photoDescription),
      image_url: urlData.publicUrl,
      storage_path: path
    });
    setBusy(false);
    if (error) { setNotice('La imagen se subió, pero no se pudo publicar en la galería.'); return; }
    setPhotoTitle(''); setPhotoDescription(''); setPhotoFile(null);
    const input = document.getElementById('photo-file'); if (input) input.value = '';
    setNotice('Foto publicada en la galería.'); await loadPublicData();
  }

  async function deletePhoto(photo) {
    if (!confirm('¿Querés eliminar esta foto de la galería?')) return;
    setBusy(true);
    await supabase.storage.from('tech-zone-photos').remove([photo.storage_path]);
    const { error } = await supabase.from('site_photos').delete().eq('id', photo.id);
    setBusy(false);
    setNotice(error ? 'No se pudo eliminar la foto.' : 'Foto eliminada.');
    await loadPublicData();
  }

  async function addService(e) {
    e.preventDefault();
    if (!newService.title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('site_services').insert({
      title: newService.title.trim(), description: newService.description.trim(), icon: 'cpu', visible: true
    });
    setBusy(false);
    setNotice(error ? 'No se pudo agregar el servicio.' : 'Servicio agregado.');
    if (!error) { setNewService({ title: '', description: '' }); await loadPublicData(); }
  }

  async function toggleService(service) {
    const { error } = await supabase.from('site_services').update({ visible: !service.visible }).eq('id', service.id);
    setNotice(error ? 'No se pudo actualizar el servicio.' : 'Servicio actualizado.');
    await loadPublicData();
  }

  const whatsappNumber = (settings.whatsapp || settings.phone).replace(/\D/g, '');
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';
  const instagramLink = settings.instagram ? (settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`) : '';
  const visibleServices = services.filter(s => s.visible !== false);
  const galleryPhotos = photos;
  const activePhoto = galleryPhotos.length ? galleryPhotos[slide % galleryPhotos.length] : null;

  if (view === 'admin' && !session) {
    return <div className="login-screen"><div className="login-card">
      <img src="/tech-zone-logo.png" alt="Logo Tech Zone" className="login-logo" />
      <span className="eyebrow">ÁREA PRIVADA</span><h1>Panel de administración</h1>
      {!configured && <div className="alert">Primero configurá Supabase. Consultá el archivo README incluido en el proyecto.</div>}
      <form onSubmit={login} className="stack">
        <label>Correo administrador<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {loginError && <p className="error">{loginError}</p>}
        <button className="btn primary full" disabled={!configured || busy}><LockKeyhole size={17}/>{busy ? 'Ingresando…' : 'Ingresar al panel'}</button>
      </form>
      <button className="text-button" onClick={()=>setView('client')}><ChevronLeft size={16}/> Volver a la página pública</button>
    </div></div>;
  }

  return <>
    <header className="topbar">
      <a href="#inicio" className="brand" onClick={()=>setView('client')}><img src="/tech-zone-logo.png" alt="Tech Zone"/><span><b>TECH ZONE</b><small>REPARACIÓN Y SERVICIO TÉCNICO</small></span></a>
      <button className="mobile-menu" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><Menu/></button>
      <nav className={mobileMenu ? 'nav open' : 'nav'}>
        {view === 'admin' ? <>
          <a href="#admin-galeria">Galería</a><a href="#admin-servicios">Servicios</a><a href="#admin-config">Configuración</a>
          <button className="btn outline small" onClick={logout}><LogOut size={16}/> Cerrar sesión</button>
        </> : <>
          <a href="#servicios" onClick={()=>setMobileMenu(false)}>Servicios</a><a href="#trabajos" onClick={()=>setMobileMenu(false)}>Trabajos</a><a href="#contacto" onClick={()=>setMobileMenu(false)}>Contacto</a>
          {whatsappLink && <a className="btn primary small" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Consultar</a>}
        </>}
      </nav>
    </header>

    {view === 'admin' && session ? <main className="admin-wrap">
      <section className="admin-heading"><div><span className="eyebrow">TECH ZONE / ADMIN</span><h1>Tu negocio, a tu manera.</h1><p>Administrá las fotos, los servicios y los datos que aparecen en tu página.</p></div><button className="btn outline" onClick={()=>{setView('client');loadPublicData();}}><Camera size={17}/> Ver página pública</button></section>
      {notice && <div className="notice"><Check size={17}/>{notice}<button onClick={()=>setNotice('')} aria-label="Cerrar"><X size={16}/></button></div>}
      <section className="admin-section" id="admin-galeria">
        <div className="section-title"><div><span className="eyebrow">01 / PORTFOLIO</span><h2>Galería de trabajos</h2><p>Las fotos se muestran públicamente cuando las publicás acá.</p></div><span className="count">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span></div>
        <div className="admin-grid">
          <form className="panel stack" onSubmit={uploadPhoto}>
            <h3><UploadCloud size={20}/> Publicar una foto</h3>
            <label className="upload-zone" htmlFor="photo-file"><UploadCloud size={30}/><b>{photoFile ? photoFile.name : 'Elegí una imagen'}</b><span>JPG, PNG o WEBP</span><input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhotoFile(e.target.files?.[0] || null)} required /></label>
            <label>Título<input value={photoTitle} onChange={e=>setPhotoTitle(e.target.value)} placeholder="Ej.: Cambio de módulo" /></label>
            <label>Descripción<textarea value={photoDescription} onChange={e=>setPhotoDescription(e.target.value)} placeholder="Contá brevemente qué trabajo realizaste…" rows="3"/></label>
            <button className="btn primary full" disabled={busy}><Plus size={17}/>{busy ? 'Publicando…' : 'Publicar en el carrusel'}</button>
          </form>
          <div className="panel"><h3><Camera size={20}/> Fotos publicadas</h3>
            {!photos.length ? <div className="empty"><Camera size={34}/><b>La galería está vacía</b><span>Cuando subas tu primera foto, aparecerá en la página de tus clientes.</span></div> :
            <div className="photo-grid">{photos.map(photo=><article className="photo-admin" key={photo.id}><img src={photo.image_url} alt={photo.title}/><div><b>{photo.title}</b><p>{photo.description}</p><button className="icon-btn danger" onClick={()=>deletePhoto(photo)} title="Eliminar foto"><Trash2 size={17}/></button></div></article>)}</div>}
          </div>
        </div>
      </section>
      <section className="admin-section" id="admin-servicios">
        <div className="section-title"><div><span className="eyebrow">02 / SERVICIOS</span><h2>Servicios publicados</h2><p>Podés ocultar temporalmente un servicio sin borrarlo.</p></div></div>
        <div className="service-admin-list">{services.map(s=><div className="service-admin-row" key={s.id}><div><b>{s.title}</b><p>{s.description}</p></div><button className={`btn ${s.visible === false ? 'outline' : 'soft'} small`} onClick={()=>toggleService(s)}>{s.visible === false ? 'Oculto · Mostrar' : 'Visible · Ocultar'}</button></div>)}</div>
        <form className="panel stack add-service" onSubmit={addService}><h3><Plus size={20}/> Agregar servicio</h3><div className="form-row"><label>Nombre<input value={newService.title} onChange={e=>setNewService({...newService,title:e.target.value})} required placeholder="Ej.: Recuperación de datos"/></label><label>Descripción<input value={newService.description} onChange={e=>setNewService({...newService,description:e.target.value})} placeholder="Qué incluye el servicio"/></label></div><button className="btn primary" disabled={busy}><Plus size={16}/> Agregar servicio</button></form>
      </section>
      <section className="admin-section" id="admin-config">
        <div className="section-title"><div><span className="eyebrow">03 / DATOS DEL NEGOCIO</span><h2>Configuración de la página</h2><p>Estos datos se actualizan en la vista pública al guardar.</p></div></div>
        <form className="panel stack" onSubmit={saveSettings}>
          <div className="form-row"><label>Nombre comercial<input value={settings.business_name || ''} onChange={e=>setSettings({...settings,business_name:e.target.value})}/></label><label>Frase principal<input value={settings.tagline || ''} onChange={e=>setSettings({...settings,tagline:e.target.value})}/></label></div>
          <div className="form-row"><label>Teléfono<input value={settings.phone || ''} onChange={e=>setSettings({...settings,phone:e.target.value})} placeholder="Ej.: 3498 123456"/></label><label>WhatsApp con código de país<input value={settings.whatsapp || ''} onChange={e=>setSettings({...settings,whatsapp:e.target.value})} placeholder="Ej.: 5493498123456"/><small>Sin +, espacios ni guiones. Para Argentina, normalmente comienza con 549.</small></label></div>
          <div className="form-row"><label>Instagram<input value={settings.instagram || ''} onChange={e=>setSettings({...settings,instagram:e.target.value})} placeholder="@tuusuario o enlace"/></label><label>Ubicación<input value={settings.address || ''} onChange={e=>setSettings({...settings,address:e.target.value})} placeholder="Ciudad, provincia"/></label></div>
          <label>Horarios de atención<input value={settings.hours || ''} onChange={e=>setSettings({...settings,hours:e.target.value})} placeholder="Ej.: Lun. a sáb. de 9 a 19 h"/></label>
          <label>Presentación<textarea rows="3" value={settings.about || ''} onChange={e=>setSettings({...settings,about:e.target.value})}/></label>
          <button className="btn primary"><Save size={17}/>{busy ? 'Guardando…' : 'Guardar configuración'}</button>
        </form>
      </section>
    </main> : <main>
      <section className="hero" id="inicio"><div className="hero-bg"></div><div className="hero-copy"><span className="eyebrow"><span className="live-dot"></span> SERVICIO TÉCNICO · SAN JUSTO</span><h1>Tu tecnología,<br/><em>en buenas manos.</em></h1><p>{settings.about || defaultSettings.about}</p><div className="hero-actions">{whatsappLink ? <a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Pedir diagnóstico <ArrowRight size={17}/></a> : <a className="btn primary" href="#contacto"><MessageCircle size={18}/> Consultar servicio <ArrowRight size={17}/></a>}<a className="btn outline" href="#servicios">Ver servicios</a></div><div className="hero-proof"><span><ShieldCheck size={17}/> Atención personalizada</span><span><BadgeCheck size={17}/> Diagnóstico claro</span></div></div><div className="hero-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><img src="/tech-zone-logo.png" alt="Logo Tech Zone" className="hero-logo"/><div className="floating-tag tag-one"><MonitorCog size={18}/><span><b>Mantenimiento</b><small>PC y notebooks</small></span></div><div className="floating-tag tag-two"><Smartphone size={18}/><span><b>Reparación móvil</b><small>Pantallas y baterías</small></span></div></div><a className="scroll-cue" href="#servicios"><span></span> DESCUBRÍ LO QUE HACEMOS</a></section>
      <section className="trust-strip"><div><Wrench/><span><b>Soluciones técnicas</b><small>Para tus dispositivos</small></span></div><div><ShieldCheck/><span><b>Atención directa</b><small>Hablás con nosotros</small></span></div><div><Clock3/><span><b>Consultá tiempos</b><small>Según cada reparación</small></span></div></section>
      <section className="section services-section" id="servicios"><div className="section-title"><div><span className="eyebrow">QUÉ PODEMOS HACER POR VOS</span><h2>Soluciones para seguir conectado.</h2><p>Revisamos tu equipo y te orientamos sobre la reparación que necesita.</p></div><span className="section-index">01 — SERVICIOS</span></div><div className="services-grid">{visibleServices.map((s,i)=>{const Icon=serviceIcons[s.icon] || Wrench;return <article className="service-card" key={s.id}><span className="service-number">0{i+1}</span><div className="service-icon"><Icon size={25}/></div><h3>{s.title}</h3><p>{s.description}</p><a href={whatsappLink || '#contacto'} target={whatsappLink ? '_blank' : undefined} rel="noreferrer">Consultar servicio <ArrowRight size={16}/></a></article>})}</div></section>
      {galleryPhotos.length > 0 && <section className="section gallery-section" id="trabajos"><div className="section-title"><div><span className="eyebrow">TRABAJOS REALES</span><h2>Detrás de cada arreglo, hay una solución.</h2><p>Algunos de los trabajos que fuimos realizando.</p></div><span className="section-index">02 — GALERÍA</span></div><div className="gallery-viewer"><img src={activePhoto?.image_url} alt={activePhoto?.title || 'Trabajo de reparación'}/><div className="gallery-caption"><div><span className="eyebrow">TECH ZONE / TRABAJO REALIZADO</span><h3>{activePhoto?.title}</h3><p>{activePhoto?.description}</p></div>{galleryPhotos.length > 1 && <div className="gallery-controls"><button className="icon-btn" onClick={()=>setSlide((slide-1+galleryPhotos.length)%galleryPhotos.length)} aria-label="Foto anterior"><ChevronLeft/></button><span>{(slide%galleryPhotos.length)+1} / {galleryPhotos.length}</span><button className="icon-btn" onClick={()=>setSlide((slide+1)%galleryPhotos.length)} aria-label="Foto siguiente"><ChevronRight/></button></div>}</div></div></section>}
      <section className="contact-section" id="contacto"><div className="contact-copy"><span className="eyebrow">¿TU EQUIPO NECESITA AYUDA?</span><h2>Contanos qué le pasa.<br/><em>Lo vemos juntos.</em></h2><p>Escribinos con la marca y el modelo de tu equipo, y contanos cuál es la falla. Te respondemos para orientarte.</p><div className="contact-actions">{whatsappLink && <a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Escribir por WhatsApp <ArrowRight size={17}/></a>}{instagramLink && <a className="btn outline" href={instagramLink} target="_blank" rel="noreferrer"><Instagram size={18}/> Instagram</a>}</div></div><div className="contact-card"><div className="contact-logo"><img src="/tech-zone-logo.png" alt="Tech Zone"/></div><h3>{settings.business_name || 'Tech Zone'}</h3><p>{settings.tagline || defaultSettings.tagline}</p><div className="contact-detail"><MapPin/><span><small>UBICACIÓN</small><b>{settings.address || 'Consultar ubicación'}</b></span></div>{settings.phone && <div className="contact-detail"><Phone/><span><small>TELÉFONO</small><b>{settings.phone}</b></span></div>}{settings.hours && <div className="contact-detail"><Clock3/><span><small>HORARIOS</small><b>{settings.hours}</b></span></div>}{instagramLink && <a className="contact-detail" href={instagramLink} target="_blank" rel="noreferrer"><Instagram/><span><small>INSTAGRAM</small><b>{settings.instagram}</b></span><ArrowRight className="detail-arrow"/></a>}</div></section>
    </main>}
    <footer className="footer"><a href="#inicio" className="footer-brand"><img src="/tech-zone-logo.png" alt="Tech Zone"/> <span><b>TECH ZONE</b><small>REPARACIÓN Y SERVICIO TÉCNICO</small></span></a><span>© {new Date().getFullYear()} Tech Zone. Todos los derechos reservados.</span><button className="footer-admin" onClick={()=>{setView('admin');setNotice('')}}><LockKeyhole size={14}/> Administrador</button></footer>
    {loading && <div className="loading-bar">Cargando información…</div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
