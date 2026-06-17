import React, { useState, useEffect } from 'react';
import { MenuItem, InventoryItem, RecipeItem } from '../../../types/models';
import Button from '../../../components/atoms/button/button';
import { api } from '../../../lib/ipc';

interface Props {
  item: MenuItem;
  onClose: () => void;
}

const RecipeModal: React.FC<Props> = ({ item, onClose }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New item form
  const [selectedInvId, setSelectedInvId] = useState<number | ''>('');
  const [qtyUsed, setQtyUsed] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, recipeRes] = await Promise.all([
          api.inventory.getAll(),
          api.menu.getRecipe({ menu_item_id: item.id })
        ]);
        
        if (invRes.success && invRes.data) {
          setInventory(invRes.data);
        }
        if (recipeRes.success && recipeRes.data) {
          setRecipeItems(recipeRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    void fetchData();
  }, [item.id]);

  const handleAddIngredient = () => {
    if (!selectedInvId || !qtyUsed) {
      return;
    }
    
    const invId = selectedInvId;
    const qty = parseFloat(qtyUsed);
    
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    
    // Check if already in recipe
    if (recipeItems.some(ri => ri.inventory_item_id === invId)) {
      console.warn('This ingredient is already in the recipe. Update the quantity instead.');
      return;
    }
    
    const invItem = inventory.find(i => i.id === invId);
    if (!invItem) {
      return;
    }
    
    setRecipeItems([
      ...recipeItems, 
      { 
        inventory_item_id: invId, 
        qty_used: qty,
        name: invItem.name,
        unit: invItem.unit
      }
    ]);
    
    setSelectedInvId('');
    setQtyUsed('');
  };

  const handleRemoveIngredient = (invId: number) => {
    setRecipeItems(recipeItems.filter(ri => ri.inventory_item_id !== invId));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.menu.updateRecipe({
        menu_item_id: item.id,
        ingredients: recipeItems.map(ri => ({
          inventory_item_id: ri.inventory_item_id,
          qty_used: ri.qty_used
        }))
      });
      
      if (res.success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading recipe...</div>
      ) : (
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          
          {/* Ingredients List */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">Current Ingredients</h3>
            {recipeItems.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50 text-center">
                No ingredients added to this recipe yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recipeItems.map(ri => (
                  <div key={ri.inventory_item_id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                    <div>
                      <span className="font-semibold text-gray-800">{ri.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({ri.qty_used} {ri.unit})</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => { handleRemoveIngredient(ri.inventory_item_id); }}
                      type="button"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add New Ingredient */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Add Ingredient</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inventory Item</label>
                <select 
                  value={selectedInvId}
                  onChange={(e) => { setSelectedInvId(e.target.value ? Number(e.target.value) : ''); }}
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select item...</option>
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                <input 
                  type="number"
                  min="0"
                  step="0.001"
                  value={qtyUsed}
                  onChange={(e) => { setQtyUsed(e.target.value); }}
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 0.5"
                />
              </div>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => { handleAddIngredient(); }}
                disabled={!selectedInvId || !qtyUsed}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={() => { onClose(); }} type="button">Cancel</Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              Save Recipe
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default RecipeModal;
