import { Button, Select, BackButton } from "../../components/atoms";
import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MenuPanel from "./components/MenuPanel";
import CartPanel from "./components/CartPanel";
import BillModal, { BillModalHandle } from "./components/BillModal";
import CancelOrderModal from "./components/CancelOrderModal";
import { useModal } from "../../hooks/useModal";
import { useToast } from "../../hooks/useToast";
import { CustomerSelect } from "../../components/organisms/CustomerSelect";
import { SvgIcon } from "../../components/atoms/svg-sprite-loader";
import { useOrderManager } from "./hooks/useOrderManager";
import { useHeader } from "../../contexts/HeaderContext";

const OrderPage: React.FC = () => {
  const { tableId: tableIdStr } = useParams();
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const billModalRef = useRef<BillModalHandle>(null);
  const { setHeader } = useHeader();

  const {
    tableId,
    orderId,
    customer,
    tableInfo,
    orderType,
    setOrderType,
    occupiedTime,
    menus,
    activeMenuId,
    setActiveMenuId,
    unsentItems,
    sentKOTs,
    handleRenameTable,
    handleCustomerSelect,
    handleAddItem,
    handleUpdateQty,
    handleUpdateNote,
    handleCancelItem,
    handleSendKOT,
    handleCancelOrder,
  } = useOrderManager(tableIdStr);

  React.useEffect(() => {
    if (tableId === 0) {
      setHeader("Take Away", null, null);
    } else if (tableInfo) {
      const title = tableInfo.custom_name
        ? `Table Order - ${tableInfo.name} (${tableInfo.custom_name})`
        : `Table ${tableInfo.name}`;
      setHeader(title, null, null);
    } else if (tableId !== null) {
      setHeader(`Table ${tableId}`, null, null);
    } else {
      setHeader("Table Order", null, null);
    }
    return () => {
      setHeader(null, null, null);
    };
  }, [tableId, tableInfo, setHeader]);

  const triggerRenameTable = () => {
    if (!tableInfo) {
      return;
    }
    let newName = tableInfo.custom_name ?? "";
    showModal({
      title: "Rename Table (Temporary)",
      content: (
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temporary Party/Customer Name
          </label>
          <input
            type="text"
            className="w-full border rounded p-2"
            defaultValue={newName}
            onChange={(e) => {
              newName = e.target.value;
            }}
            autoFocus
          />
        </div>
      ),
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const nameToSet = newName.trim() === "" ? null : newName.trim();
              void handleRenameTable(nameToSet).then((success) => {
                if (success) {
                  hideModal();
                }
              });
            }}
          >
            Save
          </Button>
        </>
      ),
    });
  };

  return (
    <div className="flex h-full bg-white relative">
      {tableId !== 0 && (
        <div className="absolute top-0 left-0 p-4 z-10">
          <BackButton to="/tables" label="Back to Tables" />
        </div>
      )}

      <div className="flex-1 p-6 pt-14 border-r bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Menu</h1>
          {menus.length > 1 && (
            <div className="w-48">
              <Select
                value={String(activeMenuId ?? "")}
                onChange={(e) => {
                  setActiveMenuId(Number(e.target.value));
                }}
              >
                {menus.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <MenuPanel menuId={activeMenuId} onAddItem={handleAddItem} />
      </div>

      <div className="w-96 bg-white p-6 pt-6 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
            {occupiedTime && (
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                <SvgIcon
                  name="clock"
                  className="h-3.5 w-3.5"
                  aria-hidden={true}
                />
                <span>Occupied: {occupiedTime}</span>
              </div>
            )}
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
            {tableId === 0 ? (
              <select
                value={orderType}
                onChange={(e) => {
                  setOrderType(
                    e.target.value as "dine-in" | "takeaway" | "delivery",
                  );
                }}
                className="bg-transparent text-emerald-800 font-bold focus:outline-none"
              >
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span>
                  {(() => {
                    if (!tableInfo) {
                      return `Table ${tableId}`;
                    }
                    if (tableInfo.custom_name) {
                      return `${tableInfo.name} (${tableInfo.custom_name})`;
                    }
                    return tableInfo.name;
                  })()}
                </span>
                <button
                  onClick={triggerRenameTable}
                  className="text-emerald-500 hover:text-emerald-600 focus:outline-none bg-emerald-50 rounded-full p-1"
                  title="Set temporary table name"
                >
                  <SvgIcon name="edit" className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </span>
        </div>

        <div className="mb-4">
          <CustomerSelect
            selectedCustomer={customer}
            onSelect={(c) => {
              void handleCustomerSelect(c);
            }}
            placeholder="Assign Customer (Optional)"
          />
        </div>

        <CartPanel
          unsentItems={unsentItems}
          sentKOTs={sentKOTs}
          onUpdateQty={handleUpdateQty}
          onUpdateNote={handleUpdateNote}
          onCancelItem={(orderItemId) => {
            showModal({
              title: "Void Item",
              content: (
                <CancelOrderModal
                  onConfirm={(note) => {
                    void handleCancelItem(orderItemId, note).then((success) => {
                      if (success) {
                        hideModal();
                      }
                    });
                  }}
                />
              ),
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>
                    Go Back
                  </Button>
                  <Button
                    type="submit"
                    form="cancel-order-form"
                    variant="danger"
                  >
                    Confirm Void
                  </Button>
                </>
              ),
            });
          }}
          onSendKOT={(print) => {
            void handleSendKOT(print).then((success) => {
              if (success) {
                if (tableId !== 0) {
                  navigate("/tables");
                }
              }
            });
          }}
          onGenerateBill={() => {
            if (!orderId) {
              showToast({
                message: "Order has not been sent to kitchen yet!",
                variant: "warning",
              });
              return;
            }
            if (unsentItems.length > 0) {
              showToast({
                message:
                  "Please save or send new items before generating bill.",
                variant: "warning",
              });
              return;
            }
            const allItems = sentKOTs.flatMap((k) => k.items);
            showModal({
              title: "Generate Final Bill",
              content: (
                <BillModal
                  ref={billModalRef}
                  orderId={orderId}
                  cart={allItems}
                  initialCustomer={customer}
                  onClose={() => {
                    hideModal();
                    if (tableId !== 0) {
                      navigate("/tables");
                    } else {
                      window.location.reload();
                    }
                  }}
                />
              ),
              size: "xl",
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      billModalRef.current?.save();
                    }}
                  >
                    Complete & Save
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      billModalRef.current?.print();
                    }}
                  >
                    Print Receipt
                  </Button>
                </>
              ),
            });
          }}
          onVoidOrder={() => {
            showModal({
              title: "Void Order",
              content: (
                <CancelOrderModal
                  onConfirm={(note) => {
                    void handleCancelOrder(note).then((success) => {
                      if (success) {
                        hideModal();
                        if (tableId !== 0) {
                          navigate("/tables");
                        }
                      }
                    });
                  }}
                />
              ),
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>
                    Go Back
                  </Button>
                  <Button
                    type="submit"
                    form="cancel-order-form"
                    variant="danger"
                  >
                    Confirm Void Order
                  </Button>
                </>
              ),
            });
          }}
        />
      </div>
    </div>
  );
};

export default OrderPage;
