import { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Check, ArrowUp, MessageSquare } from 'lucide-react';
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
  const [servicioAgregadoId, setServicioAgregadoId] = useState<string | null>(null);
  const [mostrarBotonArriba, setMostrarBotonArriba] = useState(false);

  const calcularPrecio = (precioBase: number) => {
    const expMult = MULTIPLICADORES_EXPERIENCIA[experiencia] || 1;
    const clienteMult = MULTIPLICADORES_CLIENTE[tipoCliente] || 1;
    return precioBase * expMult * clienteMult;
  };

  const valorHoraEnDivisa = divisa === 'ARS' ? valorHoraARS : valorHoraUSD;

  const tarifasFiltradas = useMemo(() => {
    if (!categoriaFiltro) return TARIFAS_COMPLETAS;
    return TARIFAS_COMPLETAS.filter((t) => t.categoria === categoriaFiltro);
  }, [categoriaFiltro]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/cdgm-logo.png" alt="CDGM Logo" className="h-24 mx-auto mb-6 object-scale-down" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-900 via-cyan-700 to-cyan-600 bg-clip-text text-transparent mb-3">
            Tarifario para profesionales
          </h1>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Configuración */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-2xl border-0 sticky top-4">
              <h2 className="text-xl font-bold text-cyan-900 mb-6">Configuración</h2>

              <div className="mb-6">
                <label className="text-sm font-bold text-cyan-700 mb-2 block">Divisa</label>
                <select
                  value={divisa}
                  onChange={(e) => setDivisa(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-cyan-900 font-semibold text-sm hover:border-cyan-400 transition"
                >
                  <option value="USD">USD (Dólares)</option>
                  <option value="ARS">ARS (Pesos)</option>
                </select>
              </div>

              <div className="mb-6">
                {divisa === 'ARS' ? (
                  <>
                    <label className="text-sm font-bold text-cyan-700 mb-2 block">Valor Hora</label>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                      <p className="text-xs text-green-600 mb-2">Valor mínimo recomendado en ARS</p>
                      <p className="text-3xl font-bold text-green-700">
                        ${formatearMoneda(valorHoraARS, 2)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="text-sm font-bold text-cyan-700 mb-2 block">Valor Hora USD</label>
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-300 mb-3">
                      <p className="text-xs text-cyan-600 mb-2">Valor actual en USD</p>
                      <p className="text-3xl font-bold text-cyan-700">
                        ${formatearMoneda(valorHoraUSD, 2)}
                      </p>
                    </div>
                    <div className="relative mb-3">
                      <span className="absolute left-3 top-2.5 text-cyan-600 font-bold">$</span>
                      <Input
                        type="text"
                        value={formatearMoneda(valorHoraUSD, 2)}
                        onChange={(e) => {
                          const valor = e.target.value.replace(/\./g, '').replace(',', '.');
                          setValorHoraUSD(parseFloat(valor) || 0);
                        }}
                        placeholder="Ej: 50,00"
                        className="w-full pl-7 pr-3 py-2 border-2 border-cyan-300 rounded-lg focus:border-cyan-500 focus:ring-cyan-500 font-bold text-sm"
                      />
                    </div>
                    <p className="text-xs text-cyan-600 mb-3">Formato: 50,00</p>
                  </>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-cyan-700 block">Tu Experiencia</label>
                  <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-2 py-1 rounded">
                    x{MULTIPLICADORES_EXPERIENCIA[experiencia] || 1}
                  </span>
                </div>
                <select
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-cyan-900 font-semibold text-sm hover:border-cyan-400 transition"
                >
                  <option value="junior">Profesional Junior</option>
                  <option value="semiSenior">Profesional Semi-Senior</option>
                  <option value="senior">Profesional Senior</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-cyan-700 block">Tipo de Cliente</label>
                  <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-2 py-1 rounded">
                    x{MULTIPLICADORES_CLIENTE[tipoCliente] || 1}
                  </span>
                </div>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-cyan-900 font-semibold text-sm hover:border-cyan-400 transition"
                >
                  <option value="A">Cliente A / Grande</option>
                  <option value="B">Cliente B / Mediana</option>
                  <option value="C">Cliente C / Pequeña</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Servicios y Presupuesto */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8 bg-white shadow-2xl border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-900">Selecciona servicios</h2>
                <button
                  onClick={() => {
                    document.getElementById('instructivo-uso')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition font-semibold text-sm border-2 border-cyan-300"
                >
                  📖 Ver instructivo de uso
                </button>
              </div>

              <div className="mb-6 pb-6 border-b-2 border-cyan-200">
                <p className="text-sm font-semibold text-cyan-700 mb-3">Filtrar por categoría:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoriaFiltro(null)}
                    className={`px-4 py-2 rounded-full font-semibold transition ${
                      categoriaFiltro === null
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                    }`}
                  >
                    Todas
                  </button>
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaFiltro(cat)}
                      className={`px-4 py-2 rounded-full font-semibold transition ${
                        categoriaFiltro === cat
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {tarifasFiltradas.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="border-2 border-cyan-200 rounded-lg p-4 hover:border-cyan-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-cyan-900">{servicio.nombre}</h3>
                        <p className="text-xs text-cyan-600 mt-1">{servicio.descripcion}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-semibold">
                          ⏱ Mínimo {servicio.horasBase} {servicio.horasBase === 1 ? 'hora' : 'horas'}
                        </span>
                      </div>
                      <button
                        onClick={() => agregarServicio(servicio.id)}
                        className={`ml-3 px-3 py-2 rounded-lg transition font-semibold text-sm flex items-center gap-1 ${
                          servicioAgregadoId === servicio.id
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-cyan-600 text-white hover:bg-cyan-700'
                        }`}
                      >
                        {servicioAgregadoId === servicio.id ? (
                          <>
                            <Check size={16} />
                            Agregado
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {itemsPresupuesto.length > 0 && (
              <Card className="p-8 bg-white shadow-2xl border-0">
                <h2 className="text-2xl font-bold text-cyan-900 mb-6">Presupuesto</h2>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-cyan-300">
                        <th className="text-left py-3 px-4 font-bold text-cyan-900">Descripción</th>
                        <th className="text-center py-3 px-4 font-bold text-cyan-900">Horas</th>
                        <th className="text-right py-3 px-4 font-bold text-cyan-900">Precio/Hora</th>
                        <th className="text-right py-3 px-4 font-bold text-cyan-900">Subtotal</th>
                        <th className="text-center py-3 px-4 font-bold text-cyan-900">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsPresupuesto.map((item) => (
                        <tr key={item.id} className="border-b border-cyan-100 hover:bg-cyan-50">
                          <td className="py-3 px-4 text-cyan-900">{item.nombre}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              value={item.horas}
                              onChange={(e) => actualizarHoras(item.id, parseFloat(e.target.value) || 1)}
                              min={item.servicio?.horasBase || 1}
                              step="1"
                              className="w-20 px-2 py-1 border border-cyan-300 rounded text-center font-semibold"
                              title={`Mínimo: ${item.servicio?.horasBase || 1} horas`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-cyan-700">
                            ${formatearMoneda(item.precioHora, 2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-cyan-900">
                            ${formatearMoneda(item.subtotal, 2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => eliminarServicio(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg border-2 border-cyan-300">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-cyan-900">Total:</span>
                    <span className="text-3xl font-bold text-cyan-700">
                      ${formatearMoneda(totalPresupuesto, 2)} {divisa}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Instructivo */}
        <div className="mt-16 mb-8">
          <Card className="p-8 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg border-2 border-cyan-200">
            <div className="max-w-4xl mx-auto">
              <h2 id="instructivo-uso" className="text-2xl font-bold text-cyan-900 mb-6 text-center">
                📖 Cómo usar el Tarifario
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    n: 1,
                    t: 'Selecciona la Divisa',
                    d: 'Elige si trabajarás en USD (Dólares) o ARS (Pesos Argentinos). Esta selección afectará todos los cálculos.',
                  },
                  {
                    n: 2,
                    t: 'Revisa el Valor Hora',
                    d: 'En ARS se utiliza el valor mínimo recomendado. En USD podés ingresar el tuyo. Este será el precio base para calcular los servicios.',
                  },
                  {
                    n: 3,
                    t: 'Indica tu Experiencia',
                    d: 'Selecciona tu nivel (Junior, Semi-Senior o Senior). Esto aplica un multiplicador al precio base.',
                  },
                  {
                    n: 4,
                    t: 'Selecciona el Tipo de Cliente',
                    d: 'Elegí entre Cliente A (Grande), B (Mediana) o C (Pequeña). Esto ajusta el precio según la magnitud del cliente.',
                  },
                  {
                    n: 5,
                    t: 'Filtra y Elige los Servicios',
                    d: 'Usá las categorías para filtrar la lista y hacé clic en "+ Agregar" para sumar cada servicio al presupuesto.',
                  },
                  {
                    n: 6,
                    t: 'Ajusta las Horas',
                    d: 'Modificá la cantidad de horas de cada servicio (respetando el mínimo). El subtotal y el total se recalculan automáticamente.',
                  },
                  {
                    n: 7,
                    t: 'Eliminá lo que no necesites',
                    d: 'Usá el botón de la papelera para quitar cualquier servicio del presupuesto.',
                  },
                  {
                    n: 8,
                    t: 'Revisa el Total',
                    d: 'El total final aparece debajo de la tabla, en la divisa seleccionada y ya con todos los multiplicadores aplicados.',
                  },
                ].map((paso) => (
                  <div
                    key={paso.n}
                    className="bg-white p-6 rounded-xl border-2 border-cyan-300 shadow-md hover:shadow-xl hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{paso.n}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-cyan-900 mb-2">{paso.t}</h3>
                        <p className="text-sm text-cyan-800">{paso.d}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </Card>
        </div>

        {/* Sugerencias */}
        <div className="mt-8 mb-16 flex justify-center">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSecU1AeQMq2PbkoO6K75lSXgGDALW0_14eMPVYkNNdQgLZQuA/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MessageSquare size={20} />
            Sugerencias de mejoras al tarifario
          </a>
        </div>
      </div>

      {mostrarBotonArriba && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 z-50"
          aria-label="Volver arriba"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
