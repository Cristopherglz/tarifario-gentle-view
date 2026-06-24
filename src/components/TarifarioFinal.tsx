import { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Check, ArrowUp, MessageSquare, Search, Minus, ShoppingCart, X, Sparkles, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  TARIFAS_COMPLETAS,
  CATEGORIAS,
  MULTIPLICADORES_EXPERIENCIA,
  MULTIPLICADORES_CLIENTE,
  type Servicio,
} from '@/lib/tarifasCompletas';

interface ItemPresupuesto {
  id: string;
  servicio: Servicio | null;
  nombre: string;
  categoria: string;
  horas: number;
  precioHora: number;
  subtotal: number;
}

const formatearMoneda = (valor: number, decimales = 2): string =>
  valor.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

export default function TarifarioFinal() {
  const [divisa, setDivisa] = useState('ARS');
  const [valorHoraUSD, setValorHoraUSD] = useState(0);
  const [valorHoraARS] = useState(11910.5);
  const [experiencia, setExperiencia] = useState('semiSenior');
  const [tipoCliente, setTipoCliente] = useState('A');
  const [itemsPresupuesto, setItemsPresupuesto] = useState<ItemPresupuesto[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [servicioAgregadoId, setServicioAgregadoId] = useState<string | null>(null);
  const [mostrarBotonArriba, setMostrarBotonArriba] = useState(false);
  const [mostrarPresupuestoMobile, setMostrarPresupuestoMobile] = useState(false);

  const calcularPrecio = (precioBase: number) => {
    const expMult = MULTIPLICADORES_EXPERIENCIA[experiencia] || 1;
    const clienteMult = MULTIPLICADORES_CLIENTE[tipoCliente] || 1;
    return precioBase * expMult * clienteMult;
  };

  const valorHoraEnDivisa = divisa === 'ARS' ? valorHoraARS : valorHoraUSD;

  const tarifasFiltradas = useMemo(() => {
    let lista = TARIFAS_COMPLETAS;
    if (categoriaFiltro) lista = lista.filter((t) => t.categoria === categoriaFiltro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (t) => t.nombre.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q),
      );
    }
    return lista;
  }, [categoriaFiltro, busqueda]);

  const conteoPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    TARIFAS_COMPLETAS.forEach((t) => {
      map[t.categoria] = (map[t.categoria] || 0) + 1;
    });
    return map;
  }, []);

  const agregarServicio = (servicioId: string) => {
    const servicio = TARIFAS_COMPLETAS.find((t) => t.id === servicioId);
    if (!servicio) return;
    const precioHora = calcularPrecio(valorHoraEnDivisa);
    const horas = servicio.horasBase;
    const subtotal = precioHora * horas;
    setItemsPresupuesto((prev) => [
      ...prev,
      {
        id: `${servicio.id}-${Date.now()}`,
        servicio,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        horas,
        precioHora,
        subtotal,
      },
    ]);
    setServicioAgregadoId(servicioId);
    setTimeout(() => setServicioAgregadoId(null), 1000);
  };

  useEffect(() => {
    const handleScroll = () => setMostrarBotonArriba(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const eliminarServicio = (id: string) =>
    setItemsPresupuesto((prev) => prev.filter((item) => item.id !== id));

  const actualizarHoras = (id: string, nuevasHoras: number) => {
    setItemsPresupuesto((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const minHoras = item.servicio?.horasBase || 1;
        const horasFinales = Math.max(nuevasHoras, minHoras);
        return { ...item, horas: horasFinales, subtotal: item.precioHora * horasFinales };
      }),
    );
  };

  const totalPresupuesto = itemsPresupuesto.reduce((sum, item) => sum + item.subtotal, 0);

  const scrollToPresupuesto = () => {
    document.getElementById('presupuesto-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMostrarPresupuestoMobile(false);
  };

  const imprimirPresupuesto = () => {
    if (itemsPresupuesto.length === 0) return;
    const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    const expLabel: Record<string, string> = { junior: 'Junior', semiSenior: 'Semi-Senior', senior: 'Senior' };
    const cliLabel: Record<string, string> = { A: 'Cliente A / Grande', B: 'Cliente B / Mediana', C: 'Cliente C / Pequeña' };
    const filas = itemsPresupuesto
      .map(
        (i) => `
        <tr>
          <td>
            <div class="nombre">${i.nombre}</div>
            <div class="cat">${i.categoria}</div>
          </td>
          <td class="c">${i.horas}</td>
          <td class="r">$${formatearMoneda(i.precioHora, 2)}</td>
          <td class="r b">$${formatearMoneda(i.subtotal, 2)}</td>
        </tr>`,
      )
      .join('');

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<title>Presupuesto CDGM - ${fecha}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0e7490;margin:32px;}
  header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0891b2;padding-bottom:16px;margin-bottom:24px;}
  header img{height:56px;object-fit:contain}
  h1{margin:0;color:#164e63;font-size:22px}
  .fecha{color:#0891b2;font-size:13px;margin-top:4px}
  .params{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .param{background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:10px 12px}
  .param .l{font-size:10px;text-transform:uppercase;color:#0891b2;font-weight:700;letter-spacing:.5px}
  .param .v{font-size:14px;color:#164e63;font-weight:700;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px}
  thead{background:#cffafe}
  th{text-align:left;padding:10px;color:#164e63;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #0891b2}
  td{padding:10px;border-bottom:1px solid #e0f2fe;color:#164e63;vertical-align:top}
  td.c{text-align:center}
  td.r{text-align:right}
  td.b{font-weight:700}
  .nombre{font-weight:600}
  .cat{font-size:11px;color:#0891b2;margin-top:2px}
  th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:right}
  th:nth-child(2){text-align:center}
  .total{background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;padding:18px 22px;border-radius:10px;display:flex;justify-content:space-between;align-items:center}
  .total .l{font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:.85}
  .total .v{font-size:26px;font-weight:800}
  footer{margin-top:32px;text-align:center;font-size:11px;color:#0891b2;border-top:1px solid #cffafe;padding-top:12px}
  @media print{body{margin:16mm}@page{margin:0}}
</style></head>
<body>
  <header>
    <img src="/cdgm-logo.png" alt="CDGM"/>
    <div style="text-align:right">
      <h1>Presupuesto profesional</h1>
      <div class="fecha">${fecha}</div>
    </div>
  </header>
  <div class="params">
    <div class="param"><div class="l">Divisa</div><div class="v">${divisa}</div></div>
    <div class="param"><div class="l">Valor hora efectivo</div><div class="v">$${formatearMoneda(calcularPrecio(valorHoraEnDivisa), 2)}</div></div>
    <div class="param"><div class="l">Experiencia</div><div class="v">${expLabel[experiencia] || experiencia}</div></div>
    <div class="param"><div class="l">Tipo de cliente</div><div class="v">${cliLabel[tipoCliente] || tipoCliente}</div></div>
  </div>
  <table>
    <thead><tr><th>Descripción</th><th>Horas</th><th>Precio/Hora</th><th>Subtotal</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="total">
    <div><div class="l">Total estimado</div><div style="font-size:11px;opacity:.8">Incluye experiencia y tipo de cliente</div></div>
    <div class="v">$${formatearMoneda(totalPresupuesto, 2)} ${divisa}</div>
  </div>
  <footer>Presupuesto generado con el Tarifario CDGM · Los valores son estimativos</footer>
  <script>window.onload=()=>{setTimeout(()=>{window.print();},300);}</script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-100 pb-24 lg:pb-8">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-cyan-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/cdgm-logo.png" alt="CDGM" className="h-10 shrink-0 object-contain" />
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-base lg:text-lg font-bold text-cyan-900 truncate">Tarifario público</h1>
              <p className="text-[11px] text-cyan-600">Calculá tu presupuesto en pocos pasos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200">
              <span className="text-xs font-semibold text-cyan-700">Divisa</span>
              <span className="text-xs font-bold text-cyan-900">{divisa}</span>
            </div>
            <button
              onClick={() => document.getElementById('instructivo-uso')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-full border border-cyan-200 transition"
            >
              📖 Instructivo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-900 via-cyan-700 to-cyan-600 bg-clip-text text-transparent">
            Armá tu presupuesto a medida
          </h2>
          <p className="text-cyan-700/80 text-sm md:text-base mt-2 max-w-2xl mx-auto">
            Consultá los valores aproximados de los servicios de diseño gráfico en Misiones.
          </p>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuración */}
          <aside className="lg:col-span-3">
            <Card className="p-5 bg-white shadow-xl border-0 lg:sticky lg:top-20">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-cyan-100">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 grid place-items-center text-white text-sm font-bold">1</div>
                <h2 className="text-base font-bold text-cyan-900">Configuración</h2>
              </div>

              {/* Divisa toggle */}
              <div className="mb-5">
                <label className="text-xs font-bold text-cyan-700 mb-2 block uppercase tracking-wide">Divisa</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-cyan-50 rounded-lg">
                  {['ARS', 'USD'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDivisa(d)}
                      className={`py-2 text-sm font-bold rounded-md transition ${
                        divisa === d ? 'bg-white text-cyan-900 shadow' : 'text-cyan-600 hover:text-cyan-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Hora */}
              <div className="mb-5">
                {divisa === 'ARS' ? (
                  <>
                    <label className="text-xs font-bold text-cyan-700 mb-2 block uppercase tracking-wide">Valor Hora</label>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <p className="text-[10px] text-green-600 mb-1 uppercase tracking-wide font-semibold">Mínimo recomendado</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${formatearMoneda(valorHoraARS, 2)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="text-xs font-bold text-cyan-700 mb-2 block uppercase tracking-wide">Valor Hora USD</label>
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200 mb-3">
                      <p className="text-[10px] text-cyan-600 mb-1 uppercase tracking-wide font-semibold">Valor actual</p>
                      <p className="text-2xl font-bold text-cyan-700">
                        ${formatearMoneda(valorHoraUSD, 2)}
                      </p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 font-bold">$</span>
                      <Input
                        type="text"
                        value={formatearMoneda(valorHoraUSD, 2)}
                        onChange={(e) => {
                          const valor = e.target.value.replace(/\./g, '').replace(',', '.');
                          setValorHoraUSD(parseFloat(valor) || 0);
                        }}
                        placeholder="50,00"
                        className="w-full pl-7 border-cyan-200 focus-visible:ring-cyan-500 font-bold text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-cyan-600 mt-1.5">Formato: 50,00</p>
                  </>
                )}
              </div>

              {/* Experiencia */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-cyan-700 uppercase tracking-wide">EXPERIENCIA DEL PROFESIONAL</label>
                  <span className="text-[10px] font-bold text-white bg-cyan-600 px-2 py-0.5 rounded-full">
                    x{MULTIPLICADORES_EXPERIENCIA[experiencia] || 1}
                  </span>
                </div>
                <select
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-cyan-900 font-semibold text-sm hover:border-cyan-400 transition"
                >
                  <option value="junior">Profesional Junior</option>
                  <option value="semiSenior">Profesional Semi-Senior</option>
                  <option value="senior">Profesional Senior</option>
                </select>
              </div>

              {/* Cliente */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-cyan-700 uppercase tracking-wide">Tipo de Cliente</label>
                  <span className="text-[10px] font-bold text-white bg-cyan-600 px-2 py-0.5 rounded-full">
                    x{MULTIPLICADORES_CLIENTE[tipoCliente] || 1}
                  </span>
                </div>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-cyan-900 font-semibold text-sm hover:border-cyan-400 transition"
                >
                  <option value="A">Cliente A / Grande</option>
                  <option value="B">Cliente B / Mediana</option>
                  <option value="C">Cliente C / Pequeña</option>
                </select>
              </div>

              {/* Resumen de tarifa efectiva */}
              <div className="mt-5 pt-4 border-t border-cyan-100">
                <p className="text-[10px] text-cyan-600 font-semibold uppercase tracking-wide mb-1">TARIFA DEL PROFESIONAL POR HORA</p>
                <p className="text-lg font-bold text-cyan-900">
                  ${formatearMoneda(calcularPrecio(valorHoraEnDivisa), 2)} <span className="text-xs text-cyan-600">{divisa}</span>
                </p>
              </div>
            </Card>
          </aside>

          {/* Servicios y Presupuesto */}
          <div className="lg:col-span-9 space-y-6">
            {/* Servicios */}
            <Card className="p-5 md:p-6 bg-white shadow-xl border-0">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 grid place-items-center text-white text-sm font-bold">2</div>
                <h2 className="text-base font-bold text-cyan-900">Seleccioná los servicios</h2>
              </div>

              {/* Buscador */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar servicio por nombre o descripción..."
                  className="pl-9 border-cyan-200 focus-visible:ring-cyan-500"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cyan-500 hover:text-cyan-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtro categorías */}
              <div className="mb-5 -mx-1 px-1 overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
                  <button
                    onClick={() => setCategoriaFiltro(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                      categoriaFiltro === null
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                    }`}
                  >
                    Todas <span className="opacity-70">({TARIFAS_COMPLETAS.length})</span>
                  </button>
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaFiltro(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                        categoriaFiltro === cat
                          ? 'bg-cyan-600 text-white shadow'
                          : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                      }`}
                    >
                      {cat} <span className="opacity-70">({conteoPorCategoria[cat] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de servicios */}
              {tarifasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-cyan-600">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se encontraron servicios</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tarifasFiltradas.map((servicio) => {
                    const agregado = servicioAgregadoId === servicio.id;
                    return (
                      <div
                        key={servicio.id}
                        className="group relative border border-cyan-200 rounded-xl p-4 hover:border-cyan-400 hover:shadow-lg transition flex flex-col bg-gradient-to-br from-white to-cyan-50/30"
                      >
                        <span className="absolute top-3 right-3 text-[10px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                          {servicio.categoria}
                        </span>
                        <h3 className="font-bold text-cyan-900 text-sm pr-20 leading-snug">{servicio.nombre}</h3>
                        {servicio.descripcion && (
                          <p className="text-xs text-cyan-700/80 mt-1.5 line-clamp-2">{servicio.descripcion}</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-cyan-100">
                          <span className="text-[11px] font-semibold text-cyan-700">
                            ⏱ Mín. {servicio.horasBase} {servicio.horasBase === 1 ? 'hora' : 'hs'}
                          </span>
                          <button
                            onClick={() => agregarServicio(servicio.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                              agregado
                                ? 'bg-green-500 text-white'
                                : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
                            }`}
                          >
                            {agregado ? (
                              <><Check size={14} /> Agregado</>
                            ) : (
                              <><Plus size={14} /> Agregar</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Presupuesto */}
            <Card id="presupuesto-section" className="p-5 md:p-6 bg-white shadow-xl border-0">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 grid place-items-center text-white text-sm font-bold shrink-0">3</div>
                  <h2 className="text-base font-bold text-cyan-900 truncate">Tu presupuesto</h2>
                </div>
                {itemsPresupuesto.length > 0 && (
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-full shrink-0">
                    {itemsPresupuesto.length} {itemsPresupuesto.length === 1 ? 'ítem' : 'ítems'}
                  </span>
                )}
              </div>

              {itemsPresupuesto.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-cyan-200 rounded-xl bg-cyan-50/30">
                  <ShoppingCart size={36} className="mx-auto text-cyan-400 mb-3" />
                  <p className="text-sm font-semibold text-cyan-700">Aún no agregaste servicios</p>
                  <p className="text-xs text-cyan-600 mt-1">Elegí servicios del listado de arriba para verlos aquí.</p>
                </div>
              ) : (
                <>
                  {/* Desktop tabla */}
                  <div className="hidden md:block overflow-x-auto mb-5 rounded-lg border border-cyan-100">
                    <table className="w-full">
                      <thead className="bg-cyan-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-bold text-cyan-900 text-xs uppercase tracking-wide">Descripción</th>
                          <th className="text-center py-3 px-4 font-bold text-cyan-900 text-xs uppercase tracking-wide">Horas</th>
                          <th className="text-right py-3 px-4 font-bold text-cyan-900 text-xs uppercase tracking-wide">Precio/Hora</th>
                          <th className="text-right py-3 px-4 font-bold text-cyan-900 text-xs uppercase tracking-wide">Subtotal</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsPresupuesto.map((item) => {
                          const min = item.servicio?.horasBase || 1;
                          return (
                            <tr key={item.id} className="border-t border-cyan-100 hover:bg-cyan-50/50">
                              <td className="py-3 px-4 text-cyan-900 text-sm">
                                <div className="font-semibold">{item.nombre}</div>
                                <div className="text-[11px] text-cyan-600 font-normal">{item.categoria}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="inline-flex items-center border border-cyan-200 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => actualizarHoras(item.id, item.horas - 1)}
                                    className="px-2 py-1 hover:bg-cyan-100 text-cyan-700 disabled:opacity-30"
                                    disabled={item.horas <= min}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.horas}
                                    onChange={(e) => actualizarHoras(item.id, parseFloat(e.target.value) || min)}
                                    min={min}
                                    step="1"
                                    className="w-12 text-center font-bold text-sm text-cyan-900 outline-none"
                                  />
                                  <button
                                    onClick={() => actualizarHoras(item.id, item.horas + 1)}
                                    className="px-2 py-1 hover:bg-cyan-100 text-cyan-700"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-cyan-700 text-sm">
                                ${formatearMoneda(item.precioHora, 2)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-cyan-900 text-sm">
                                ${formatearMoneda(item.subtotal, 2)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  onClick={() => eliminarServicio(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  aria-label="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3 mb-5">
                    {itemsPresupuesto.map((item) => {
                      const min = item.servicio?.horasBase || 1;
                      return (
                        <div key={item.id} className="border border-cyan-200 rounded-lg p-3 bg-white">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-cyan-900 text-sm">{item.nombre}</p>
                              <p className="text-[11px] text-cyan-600">{item.categoria}</p>
                            </div>
                            <button
                              onClick={() => eliminarServicio(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center border border-cyan-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => actualizarHoras(item.id, item.horas - 1)}
                                className="px-2 py-1 hover:bg-cyan-100 text-cyan-700 disabled:opacity-30"
                                disabled={item.horas <= min}
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                value={item.horas}
                                onChange={(e) => actualizarHoras(item.id, parseFloat(e.target.value) || min)}
                                min={min}
                                step="1"
                                className="w-10 text-center font-bold text-sm text-cyan-900 outline-none"
                              />
                              <button
                                onClick={() => actualizarHoras(item.id, item.horas + 1)}
                                className="px-2 py-1 hover:bg-cyan-100 text-cyan-700"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-cyan-600">Subtotal</p>
                              <p className="font-bold text-cyan-900 text-sm">${formatearMoneda(item.subtotal, 2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-5 rounded-xl text-white">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-cyan-100 font-semibold">Total estimado</p>
                        <p className="text-[11px] text-cyan-100/80">Incluye experiencia y tipo de cliente</p>
                      </div>
                      <span className="text-2xl md:text-3xl font-bold">
                        ${formatearMoneda(totalPresupuesto, 2)} <span className="text-sm font-semibold opacity-80">{divisa}</span>
                      </span>
                    </div>
                    <button
                      onClick={imprimirPresupuesto}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-cyan-700 hover:bg-cyan-50 rounded-lg font-bold text-sm shadow transition"
                    >
                      <Printer size={16} /> Imprimir presupuesto
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Instructivo */}
        <div className="mt-12">
          <Card className="p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg border border-cyan-200">
            <div className="max-w-4xl mx-auto">
              <h2 id="instructivo-uso" className="text-2xl font-bold text-cyan-900 mb-6 text-center">
                📖 Cómo usar el Tarifario
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { n: 1, t: 'Seleccioná la Divisa', d: 'Elegí si trabajarás en USD (Dólares) o ARS (Pesos Argentinos). Esta selección afectará todos los cálculos.' },
                  { n: 2, t: 'Revisá el Valor Hora', d: 'En ARS se utiliza el valor mínimo recomendado. En USD podés ingresar el tuyo. Este será el precio base para calcular los servicios.' },
                  { n: 3, t: 'Indicá tu Experiencia', d: 'Seleccioná tu nivel (Junior, Semi-Senior o Senior). Esto aplica un multiplicador al precio base.' },
                  { n: 4, t: 'Seleccioná el Tipo de Cliente', d: 'Elegí entre Cliente A (Grande), B (Mediana) o C (Pequeña). Esto ajusta el precio según la magnitud del cliente.' },
                  { n: 5, t: 'Buscá y Elegí los Servicios', d: 'Usá el buscador o las categorías para filtrar y hacé clic en "+ Agregar" para sumar cada servicio al presupuesto.' },
                  { n: 6, t: 'Ajustá las Horas', d: 'Usá los botones + y − para modificar la cantidad de horas (respetando el mínimo). El subtotal se recalcula automáticamente.' },
                  { n: 7, t: 'Eliminá lo que no necesites', d: 'Usá el botón de la papelera para quitar cualquier servicio del presupuesto.' },
                  { n: 8, t: 'Revisá el Total', d: 'El total final aparece debajo de la tabla, en la divisa seleccionada y ya con todos los multiplicadores aplicados.' },
                ].map((paso) => (
                  <div
                    key={paso.n}
                    className="bg-white p-5 rounded-xl border border-cyan-200 shadow-sm hover:shadow-md hover:border-cyan-400 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg grid place-items-center text-white font-bold">
                        {paso.n}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-cyan-900 mb-1">{paso.t}</h3>
                        <p className="text-xs text-cyan-800 leading-relaxed">{paso.d}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sugerencias */}
        <div className="mt-8 flex justify-center">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSecU1AeQMq2PbkoO6K75lSXgGDALW0_14eMPVYkNNdQgLZQuA/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition font-bold shadow-lg hover:shadow-xl"
          >
            <MessageSquare size={18} />
            Sugerencias de mejoras al tarifario
          </a>
        </div>
      </div>

      {/* Bottom Bar Mobile - resumen presupuesto */}
      {itemsPresupuesto.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-cyan-200 shadow-2xl z-40 p-3">
          <button
            onClick={scrollToPresupuesto}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-bold"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingCart size={16} />
              {itemsPresupuesto.length} {itemsPresupuesto.length === 1 ? 'ítem' : 'ítems'}
            </span>
            <span className="text-sm">
              ${formatearMoneda(totalPresupuesto, 2)} {divisa}
            </span>
          </button>
        </div>
      )}

      {mostrarBotonArriba && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-3 shadow-lg z-30"
          aria-label="Volver arriba"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
