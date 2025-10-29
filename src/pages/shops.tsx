import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import "../styles/registered.css";
import { FaTrash, FaInfoCircle, FaTimes, FaMapPin, FaClock } from "react-icons/fa";

type ShopDoc = { 
  uid: string;
  technicianId?: string;
  name?: string;
  address?: string;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  workingDays?: string[];
  yearsInService?: string;
  latitude?: number;
  longitude?: number;
  locationPhoto?: string;
  openingHours?: string;
};

type TechnicianData = {
  username?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  location?: string;
  address?: string;
  shopAddress?: string;
};

export default function Shops() {
  const [shops, setShops] = useState<ShopDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShopDoc | null>(null);
  const [technicianData, setTechnicianData] = useState<TechnicianData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubShops = onSnapshot(
      collection(db, "shops"),
      (snapshot) => {
        const shops = snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        
        // Fetch technician data for each shop to check if technician is deleted
        Promise.all(shops.map(async (shop) => {
          if (shop.technicianId) {
            try {
              const techDoc = await getDoc(doc(db, "technicians", shop.technicianId));
              if (techDoc.exists()) {
                const techData = techDoc.data();
                return { ...shop, technicianIsDeleted: techData.isDeleted || false };
              }
            } catch (err) {
              console.error("Error fetching technician data for shop:", err);
            }
          }
          return { ...shop, technicianIsDeleted: false };
        })).then(enhancedShops => {
          // Filter out shops where the technician is deleted
          const validShops = enhancedShops.filter(shop => !shop.technicianIsDeleted);
          setShops(validShops);
          setLoading(false);
        });
      },
      (err) => {
        console.error("shops onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubShops();
  }, []);

  // Fetch technician data when shop is selected
  useEffect(() => {
    const fetchTechnicianData = async () => {
      if (selected?.technicianId) {
        try {
          const techDoc = await getDoc(doc(db, "technicians", selected.technicianId));
          if (techDoc.exists()) {
            const data = techDoc.data();
            setTechnicianData({
              username: data.username || '',
              email: data.email || '',
              phone: data.phone || '',
              fullName: data.fullName || data.displayName || '',
              location: data.location || '',
              address: data.address || '',
              shopAddress: data.shopAddress || '',
            });
          } else {
            setTechnicianData(null);
          }
        } catch (err) {
          console.error("Error fetching technician data:", err);
          setTechnicianData(null);
        }
      }
    };

    fetchTechnicianData();
  }, [selected]);

  const handleDelete = async (docItem: ShopDoc) => {
    if (!docItem?.uid) return;
    
    setConfirmTitle("Delete Shop");
    setConfirmMessage("Are you sure you want to delete this shop? This will also delete the technician associated with this shop.");
    setConfirmAction(() => async () => {
      try {
        // First, mark the technician as deleted
        if (docItem.technicianId) {
          await setDoc(doc(db, "technicians", docItem.technicianId), {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: "admin"
          }, { merge: true });
        }
        
        // Then delete the shop
        await deleteDoc(doc(db, "shops", docItem.uid));
        setSelected(null);
        setShowConfirmModal(false);
        setConfirmAction(null);
      } catch (err) {
        console.error("Failed to delete shop doc:", err);
        alert("Failed to delete. Check console for details.");
        setShowConfirmModal(false);
        setConfirmAction(null);
      }
    });
    setShowConfirmModal(true);
  };

  return (
    <DashboardLayout activeMenu="shops">
      <div className="registered-container">
        <div className="header-section">
          <h2 className="page-title">🏬 Shops Owners</h2>
          <p className="page-subtitle">Review and manage all registered shops.</p>
        </div>

        {loading ? (
          <div className="loading">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="empty-state">No shops found.</div>
        ) : (
          <div className="cards-grid">
            {shops.map((s) => (
              <div key={s.uid} className="registered-card">
                <h3>{s.name || `Shop · ${s.uid.slice(0, 6)}`}</h3>
                <button className="details-btn" onClick={() => setSelected(s)}>
                  <FaInfoCircle /> View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="shop-modal-overlay" onClick={() => { setSelected(null); setTechnicianData(null); }}>
            <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
              <button className="shop-modal-close" onClick={() => { setSelected(null); setTechnicianData(null); }}>
                <FaTimes />
              </button>

              <h2>🏬 {selected.name || `Shop ${selected.uid.slice(0, 6)}`}</h2>
              <p style={{ color: '#666', marginTop: '-0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Shop ID: {selected.uid}</p>

              {/* Shop Information Section */}
              <div className="shop-modal-section">
                <h3><FaMapPin style={{ marginRight: '8px' }} />Shop Details</h3>
                <p><strong>Shop Name:</strong> {selected.name || "Not set"}</p>
                <p><strong>Shop Address:</strong> {selected.address || technicianData?.shopAddress || technicianData?.location || technicianData?.address || "Not set"}</p>
                {selected.latitude && selected.longitude && (
                  <p><strong>Coordinates:</strong> {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}</p>
                )}
                {selected.yearsInService && (
                  <p><strong>Years in Service:</strong> {selected.yearsInService} years</p>
                )}
              </div>

              {/* Working Hours Section */}
              {selected.workingHours && (
                <div className="shop-modal-section">
                  <h3><FaClock style={{ marginRight: '8px' }} />Operating Hours</h3>
                  <p><strong>Opening Time:</strong> {selected.workingHours.startTime || "Not set"}</p>
                  <p><strong>Closing Time:</strong> {selected.workingHours.endTime || "Not set"}</p>
                  {selected.workingDays && selected.workingDays.length > 0 && (
                    <p><strong>Working Days:</strong> {selected.workingDays.join(", ")}</p>
                  )}
                </div>
              )}

              {/* Technician Information Section removed per request */}

              {/* Location Photo */}
              {selected.locationPhoto && (
                <div className="shop-modal-section">
                  <h3><FaMapPin style={{ marginRight: '8px' }} />Location Photo</h3>
                  <img 
                    src={selected.locationPhoto} 
                    alt="Shop Location" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '8px', 
                      marginTop: '0.5rem',
                      border: '2px solid #ddd',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(selected.locationPhoto, '_blank')}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="shop-modal-actions">
                <button className="shop-delete-btn" onClick={() => handleDelete(selected)}>
                  <FaTrash /> Delete Shop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={() => confirmAction && confirmAction()}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
