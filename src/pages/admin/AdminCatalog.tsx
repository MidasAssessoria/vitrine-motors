import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { fetchBrands, fetchModelsByBrand, fetchTrimsByModel } from '../../lib/catalog';
import { createBrand, deleteBrand, createModel, deleteModel, deleteTrim, fetchPendingCustomBrands, approveCustomBrand } from '../../lib/adminCatalog';
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, CATEGORIES_BY_TYPE } from '../../data/constants';
import type { Brand, Model, Trim, VehicleType } from '../../types';

export function AdminCatalog() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterType, setFilterType] = useState<VehicleType | ''>('');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [models, setModels] = useState<Record<string, Model[]>>({});
  const [trims, setTrims] = useState<Record<string, Trim[]>>({});
  const [pendingBrands, setPendingBrands] = useState<{ custom_brand: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // New brand form
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', country: '', vehicle_types: ['auto'] as VehicleType[] });

  // New model form
  const [showNewModel, setShowNewModel] = useState<string | null>(null);
  const [newModel, setNewModel] = useState({ name: '', category: '', vehicle_type: 'auto' as VehicleType });

  // Approve brand inline form
  const [approvingBrand, setApprovingBrand] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState({ vehicleType: 'auto' as VehicleType, country: 'China' });

  const loadBrands = async () => {
    setLoading(true);
    const data = await fetchBrands(filterType || undefined);
    setBrands(data);
    setLoading(false);
  };

  const loadPending = async () => {
    const data = await fetchPendingCustomBrands();
    setPendingBrands(data);
  };

  useEffect(() => { loadBrands(); }, [filterType]);
  useEffect(() => { loadPending(); }, []);

  const handleExpandBrand = async (brandId: string) => {
    if (expandedBrand === brandId) {
      setExpandedBrand(null);
      return;
    }
    setExpandedBrand(brandId);
    if (!models[brandId]) {
      const m = await fetchModelsByBrand(brandId);
      setModels((prev) => ({ ...prev, [brandId]: m }));
    }
  };

  const handleExpandModel = async (modelId: string) => {
    if (expandedModel === modelId) {
      setExpandedModel(null);
      return;
    }
    setExpandedModel(modelId);
    if (!trims[modelId]) {
      const t = await fetchTrimsByModel(modelId);
      setTrims((prev) => ({ ...prev, [modelId]: t }));
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.name) return;
    await createBrand({ name: newBrand.name, country: newBrand.country, vehicle_types: newBrand.vehicle_types });
    setNewBrand({ name: '', country: '', vehicle_types: ['auto'] });
    setShowNewBrand(false);
    loadBrands();
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('¿Eliminar esta marca y todos sus modelos?')) return;
    await deleteBrand(id);
    loadBrands();
  };

  const handleCreateModel = async (brandId: string) => {
    if (!newModel.name) return;
    await createModel({ brand_id: brandId, name: newModel.name, category: newModel.category, vehicle_type: newModel.vehicle_type });
    setNewModel({ name: '', category: '', vehicle_type: 'auto' });
    setShowNewModel(null);
    const m = await fetchModelsByBrand(brandId);
    setModels((prev) => ({ ...prev, [brandId]: m }));
  };

  const handleDeleteModel = async (modelId: string, brandId: string) => {
    if (!confirm('¿Eliminar este modelo y todos sus trims?')) return;
    await deleteModel(modelId);
    const m = await fetchModelsByBrand(brandId);
    setModels((prev) => ({ ...prev, [brandId]: m }));
  };

  const handleApproveBrand = async () => {
    if (!approvingBrand) return;
    await approveCustomBrand(approvingBrand, [approveForm.vehicleType], approveForm.country || 'China');
    setApprovingBrand(null);
    setApproveForm({ vehicleType: 'auto', country: 'China' });
    loadPending();
    loadBrands();
  };

  const toggleVehicleType = (type: VehicleType) => {
    setNewBrand((prev) => ({
      ...prev,
      vehicle_types: prev.vehicle_types.includes(type)
        ? prev.vehicle_types.filter((t) => t !== type)
        : [...prev.vehicle_types, type],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Catálogo de Marcas</h1>
        <Button onClick={() => setShowNewBrand(!showNewBrand)}>
          <Plus size={16} className="mr-1" /> Nueva marca
        </Button>
      </div>

      {/* Pending custom brands */}
      {pendingBrands.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Marcas pendientes de aprobación ({pendingBrands.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {pendingBrands.map((pb) => (
              <div key={pb.custom_brand} className="flex flex-col gap-2 bg-white rounded-lg border border-amber-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{pb.custom_brand}</span>
                  <span className="text-xs text-text-secondary">({pb.count} anuncios)</span>
                  <button
                    onClick={() => { setApprovingBrand(pb.custom_brand); setApproveForm({ vehicleType: 'auto', country: 'China' }); }}
                    className="text-xs bg-success-green text-white px-2 py-1 rounded font-medium hover:bg-success-green/80 cursor-pointer"
                  >
                    <Check size={12} className="inline mr-0.5" /> Aprobar
                  </button>
                </div>
                {approvingBrand === pb.custom_brand && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-100">
                    <select
                      value={approveForm.vehicleType}
                      onChange={(e) => setApproveForm((f) => ({ ...f, vehicleType: e.target.value as VehicleType }))}
                      className="text-xs border border-border rounded px-2 py-1"
                    >
                      <option value="auto">Auto</option>
                      <option value="moto">Moto</option>
                      <option value="barco">Barco</option>
                    </select>
                    <input
                      type="text"
                      value={approveForm.country}
                      onChange={(e) => setApproveForm((f) => ({ ...f, country: e.target.value }))}
                      placeholder="País de origen"
                      className="text-xs border border-border rounded px-2 py-1 w-28"
                    />
                    <button onClick={handleApproveBrand} className="text-xs bg-success-green text-white px-2 py-1 rounded font-medium hover:bg-success-green/80 cursor-pointer">
                      Confirmar
                    </button>
                    <button onClick={() => setApprovingBrand(null)} className="text-xs text-text-secondary hover:text-accent-red cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter by type */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${!filterType ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-gray-200'}`}
        >
          Todos
        </button>
        {VEHICLE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${filterType === type ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-gray-200'}`}
          >
            {VEHICLE_TYPE_LABELS[type].plural}
          </button>
        ))}
      </div>

      {/* New brand form */}
      {showNewBrand && (
        <div className="bg-white border border-border rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">Nueva marca</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Nombre" placeholder="Ej: BYD" value={newBrand.name} onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} />
            <Input label="País" placeholder="Ej: China" value={newBrand.country} onChange={(e) => setNewBrand((p) => ({ ...p, country: e.target.value }))} />
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Tipos</label>
              <div className="flex gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBrand.vehicle_types.includes(type)}
                      onChange={() => toggleVehicleType(type)}
                      className="rounded"
                    />
                    {VEHICLE_TYPE_LABELS[type].singular}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-3 gap-2">
            <Button variant="outline" onClick={() => setShowNewBrand(false)}>Cancelar</Button>
            <Button onClick={handleCreateBrand}>Crear marca</Button>
          </div>
        </div>
      )}

      {/* Brands list */}
      {loading ? (
        <p className="text-center text-text-secondary py-8">Cargando...</p>
      ) : (
        <div className="space-y-1">
          {brands.map((brand) => (
            <div key={brand.id} className="border border-border rounded-xl overflow-hidden bg-white">
              {/* Brand row */}
              <div
                className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary/50 cursor-pointer"
                onClick={() => handleExpandBrand(brand.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedBrand === brand.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-semibold text-text-primary">{brand.name}</span>
                  <span className="text-xs text-text-secondary">{brand.country}</span>
                  <div className="flex gap-1">
                    {(brand.vehicle_types || ['auto']).map((t) => (
                      <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBrand(brand.id); }}
                    className="p-1.5 rounded hover:bg-accent-red/10 text-text-secondary hover:text-accent-red cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Models */}
              {expandedBrand === brand.id && (
                <div className="border-t border-border bg-bg-secondary/30 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Modelos</span>
                    <button
                      onClick={() => setShowNewModel(showNewModel === brand.id ? null : brand.id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Agregar modelo
                    </button>
                  </div>

                  {showNewModel === brand.id && (
                    <div className="bg-white border border-border rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input label="Nombre" placeholder="Ej: Hilux" value={newModel.name} onChange={(e) => setNewModel((p) => ({ ...p, name: e.target.value }))} />
                        <Select
                          label="Categoría"
                          options={(CATEGORIES_BY_TYPE[newModel.vehicle_type] || CATEGORIES_BY_TYPE.auto).filter((c) => c.value).map((c) => ({ value: c.value, label: c.label }))}
                          value={newModel.category}
                          onChange={(e) => setNewModel((p) => ({ ...p, category: e.target.value }))}
                        />
                        <Select
                          label="Tipo"
                          options={VEHICLE_TYPES.map((t) => ({ value: t, label: VEHICLE_TYPE_LABELS[t].singular }))}
                          value={newModel.vehicle_type}
                          onChange={(e) => setNewModel((p) => ({ ...p, vehicle_type: e.target.value as VehicleType }))}
                        />
                      </div>
                      <div className="flex justify-end mt-2 gap-2">
                        <Button variant="outline" onClick={() => setShowNewModel(null)}>Cancelar</Button>
                        <Button onClick={() => handleCreateModel(brand.id)}>Crear</Button>
                      </div>
                    </div>
                  )}

                  {(models[brand.id] || []).length === 0 ? (
                    <p className="text-xs text-text-secondary italic">Sin modelos registrados</p>
                  ) : (
                    <div className="space-y-1">
                      {(models[brand.id] || []).map((model) => (
                        <div key={model.id} className="bg-white rounded-lg border border-border">
                          <div
                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-bg-secondary/30"
                            onClick={() => handleExpandModel(model.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedModel === model.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span className="text-sm font-medium">{model.name}</span>
                              <span className="text-[10px] bg-bg-secondary text-text-secondary px-1.5 py-0.5 rounded">{model.category}</span>
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{model.vehicle_type}</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, brand.id); }}
                              className="p-1 rounded hover:bg-accent-red/10 text-text-secondary hover:text-accent-red cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {expandedModel === model.id && (
                            <div className="border-t border-border px-3 py-2 bg-bg-secondary/20">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Trims</span>
                              {(trims[model.id] || []).length === 0 ? (
                                <p className="text-xs text-text-secondary italic mt-1">Sin trims</p>
                              ) : (
                                <div className="space-y-0.5 mt-1">
                                  {(trims[model.id] || []).map((trim) => (
                                    <div key={trim.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5 border border-border/50">
                                      <span>{trim.name} {trim.horsepower ? `· ${trim.horsepower}hp` : ''} {trim.engine_cc ? `· ${trim.engine_cc}cc` : ''}</span>
                                      <button
                                        onClick={() => { deleteTrim(trim.id); fetchTrimsByModel(model.id).then((t) => setTrims((prev) => ({ ...prev, [model.id]: t }))); }}
                                        className="text-text-secondary hover:text-accent-red cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
