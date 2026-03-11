import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Image as ImageIcon, 
  FileUp, 
  Filter,
  Car,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle
} from 'lucide-react';
import { getVehicles, deleteVehicle, API_BASE_URL } from './api';
import VehicleForm from './components/VehicleForm';
import PhotoManager from './components/PhotoManager';
import ExcelImport from './components/ExcelImport';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showNoPhotosOnly, setShowNoPhotosOnly] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este vehículo?')) {
      try {
        await deleteVehicle(id);
        fetchVehicles();
      } catch (error) {
        alert('Error al eliminar el vehículo');
      }
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.version?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesPhotoFilter = !showNoPhotosOnly || v.photoCount === 0;

    return matchesSearch && matchesStatus && matchesPhotoFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      'Disponible': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Reservado': 'bg-amber-100 text-amber-700 border-amber-200',
      'Vendido': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['Disponible']}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Car size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">StockControl</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="btn-secondary"
            >
              <FileUp size={18} />
              <span className="hidden sm:inline">Importar Excel</span>
            </button>
            <button 
              onClick={() => { setEditingVehicle(null); setIsFormOpen(true); }}
              className="btn-primary"
            >
              <Plus size={18} />
              <span>Nuevo Vehículo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Filters & Stats */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar marca, modelo..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
            </select>
            <button 
              onClick={() => setShowNoPhotosOnly(!showNoPhotosOnly)}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showNoPhotosOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <AlertCircle size={18} />
              <span>Sin fotos ({vehicles.filter(v => v.photoCount === 0).length})</span>
            </button>
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            {filteredVehicles.length} vehículos encontrados
          </div>
        </div>

        {/* Dashboard Table */}
        <div className="table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-sm uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Vehículo</th>
                <th className="px-6 py-4">Año</th>
                <th className="px-6 py-4">KM</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fotos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">Cargando vehículos...</td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">No se encontraron vehículos</td>
                </tr>
              ) : filteredVehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{v.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{v.brand} {v.model}</div>
                    <div className="text-xs text-slate-500">{v.version || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{v.year}</td>
                  <td className="px-6 py-4 text-slate-600">{v.mileage?.toLocaleString()} km</td>
                  <td className="px-6 py-4 font-bold text-blue-600">${v.price?.toLocaleString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                  <td className="px-6 py-4">
                    <div 
                      className={`flex items-center gap-1.5 cursor-pointer hover:underline ${v.photoCount === 0 ? 'text-amber-600' : 'text-slate-500'}`}
                      onClick={() => { setSelectedVehicle(v); setIsPhotoManagerOpen(true); }}
                    >
                      <ImageIcon size={16} />
                      <span className="font-medium text-sm">{v.photoCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingVehicle(v); setIsFormOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      {isFormOpen && (
        <VehicleForm 
          vehicle={editingVehicle} 
          onClose={() => setIsFormOpen(false)} 
          onSave={() => { setIsFormOpen(false); fetchVehicles(); }}
        />
      )}

      {isPhotoManagerOpen && (
        <PhotoManager 
          vehicle={selectedVehicle} 
          onClose={() => setIsPhotoManagerOpen(false)} 
          onChange={() => fetchVehicles()}
        />
      )}

      {isImportOpen && (
        <ExcelImport 
          onClose={() => setIsImportOpen(false)} 
          onImported={() => { setIsImportOpen(false); fetchVehicles(); }}
        />
      )}
    </div>
  );
}

export default App;
