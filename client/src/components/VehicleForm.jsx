import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { createVehicle, updateVehicle } from '../api';

const VehicleForm = ({ vehicle, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    version: '',
    mileage: '',
    fuel: 'Nafta',
    transmission: 'Manual',
    color: '',
    price: '',
    description: '',
    status: 'Disponible'
  });

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    }
  }, [vehicle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await createVehicle(formData);
      }
      onSave();
    } catch (error) {
      alert('Error al guardar el vehículo');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">
            {vehicle ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Marca *</label>
            <input 
              required name="brand" value={formData.brand} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Modelo *</label>
            <input 
              required name="model" value={formData.model} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Año</label>
            <input 
              type="number" name="year" value={formData.year} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Versión</label>
            <input 
              name="version" value={formData.version} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Kilometraje</label>
            <input 
              type="number" name="mileage" value={formData.mileage} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Precio (USD)</label>
            <input 
              type="number" name="price" value={formData.price} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Combustible</label>
            <select 
              name="fuel" value={formData.fuel} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Nafta">Nafta</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Transmisión</label>
            <select 
              name="transmission" value={formData.transmission} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Manual">Manual</option>
              <option value="Automática">Automática</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Color</label>
            <input 
              name="color" value={formData.color} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Estado</label>
            <select 
              name="status" value={formData.status} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descripción</label>
            <textarea 
              name="description" value={formData.description} onChange={handleChange} rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">
              <Save size={18} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
