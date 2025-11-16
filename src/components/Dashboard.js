// components/Dashboard.js
import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ productos, clientes, ventas }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Estadísticas
  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const ventasHoy = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]).reduce((sum, v) => sum + v.total, 0);
  const productosStockBajo = productos.filter(p => !p.in_stock).length;

  // Datos para gráficos
  const ventasUltimos7Dias = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const ventasDia = ventas.filter(v => v.fecha === fechaStr);
      dias.push({
        fecha: fechaStr.slice(5),
        total: ventasDia.reduce((sum, v) => sum + v.total, 0)
      });
    }
    return dias;
  }, [ventas]);

  const productosPorCategoria = useMemo(() => {
    const categorias = {};
    productos.forEach(p => {
      categorias[p.category] = (categorias[p.category] || 0) + 1;
    });
    return Object.entries(categorias).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }, [productos]);

  const ventasPorMetodoPago = useMemo(() => {
    const metodos = {};
    ventas.forEach(v => {
      metodos[v.pago] = (metodos[v.pago] || 0) + v.total;
    });
    return Object.entries(metodos).map(([nombre, valor]) => ({ nombre, valor }));
  }, [ventas]);

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Total</span>
          </div>
          <h3 className="text-2xl font-bold">${totalVentas.toLocaleString()}</h3>
          <p className="text-sm opacity-90">Ventas totales</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Hoy</span>
          </div>
          <h3 className="text-2xl font-bold">${ventasHoy.toLocaleString()}</h3>
          <p className="text-sm opacity-90">Ventas de hoy</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Activos</span>
          </div>
          <h3 className="text-2xl font-bold">{clientes.length}</h3>
          <p className="text-sm opacity-90">Clientes totales</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Alerta</span>
          </div>
          <h3 className="text-2xl font-bold">{productosStockBajo}</h3>
          <p className="text-sm opacity-90">Sin stock</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Ventas - Últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ventasUltimos7Dias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Productos por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productosPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Acceso rápido a Ventas */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg text-center">
        <h3 className="text-2xl font-bold mb-2">Módulo de Ventas</h3>
        <p className="mb-4 opacity-90">Gestiona ventas, clientes y estadísticas</p>
        <button
          onClick={() => window.location.href = '/admin/ventas'}
          className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
        >
          🚀 Ir a Ventas
        </button>
      </div>
    </div>
  );
};

export default Dashboard;