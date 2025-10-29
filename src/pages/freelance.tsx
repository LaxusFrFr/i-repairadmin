import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";
import "../styles/freelance.css";
import "../styles/registered.css"; // reuse shop modal styles
import { 
  FaTrash, 
  FaInfoCircle, 
  FaMapPin, 
  FaClock,
  FaTimes
} from "react-icons/fa";

interface FreelanceTechnician {
  uid: string;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  skills?: string[];
  categories?: string[];
  description?: string;
  yearsInService?: number;
  status?: string;
  createdAt?: any;
  submitted?: any;
  hasShop?: boolean;
  profileImage?: string;
  isDeleted?: boolean;
  [key: string]: any;
}

export default function Freelance() {
  const [freelancers, setFreelancers] = useState<FreelanceTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FreelanceTechnician | null>(null);
  const confirmation = useConfirmation();

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "technicians"),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ 
          uid: d.id, 
          ...(d.data() as any) 
        })) as FreelanceTechnician[];
        
        const freelanceTechs = docs.filter((t) => {
          const status = typeof t.status === "string" ? t.status.toLowerCase() : "";
          return !t.isDeleted && status === "approved" && !t.hasShop;
        });
        
        setFreelancers(freelanceTechs);
        setLoading(false);
      },
      (err) => {
        console.error("technicians onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);


  const formatTime = (time24: string) => {
    if (!time24) return "Not set";
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time24; // Return original if conversion fails
    }
  };


  const handleDelete = async (freelancer: FreelanceTechnician) => {
    if (!freelancer?.uid) return;
    
    const ok = await confirmation.confirm(
      "Delete Freelance Technician",
      `Are you sure you want to delete ${freelancer.username || freelancer.fullName || 'this freelance technician'} permanently? This will mark the technician as deleted and remove them from the system.`,
      "danger"
    );
    if (ok) {
      try {
        // Mark as deleted instead of deleting the document
        await setDoc(doc(db, "technicians", freelancer.uid), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: "admin"
        }, { merge: true });
        setSelected(null);
      } catch (err) {
        console.error("Failed to delete technician doc:", err);
        alert("Failed to delete. Check console for details.");
      }
    }
  };

  return (
    <DashboardLayout activeMenu="freelance">
      <div className="registered-container">
        <div className="header-section">
          <h2 className="page-title">👨‍🔧 Freelance Technicians</h2>
          <p className="page-subtitle">Review and manage all approved freelance technicians.</p>
        </div>

        {loading ? (
          <div className="loading">Loading freelance technicians...</div>
        ) : freelancers.length === 0 ? (
          <div className="empty-state">No freelance technicians found.</div>
        ) : (
          <div className="cards-grid">
            {freelancers.map((f) => (
              <div key={f.uid} className="freelance-card">
                <h3>{f.username || f.fullName || f.name || `Freelancer · ${f.uid.slice(0, 6)}`}</h3>
                
                <button className="details-btn" onClick={() => setSelected(f)}>
                  <FaInfoCircle /> View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="shop-modal-overlay" onClick={() => setSelected(null)}>
            <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
              <button className="shop-modal-close" onClick={() => setSelected(null)}>
                <FaTimes />
              </button>

              <h2>👨‍🔧 {selected.username || selected.fullName || selected.name || `Freelancer ${selected.uid.slice(0, 6)}`}</h2>
              <p style={{ color: '#666', marginTop: '-0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Freelance ID: {selected.uid}</p>

              {/* Details Section - same structure as shop */}
              <div className="shop-modal-section">
                <h3><FaMapPin style={{ marginRight: '8px' }} />Freelance Details</h3>
                <p><strong>Name:</strong> {selected.username || selected.fullName || selected.name || 'Not set'}</p>
                <p><strong>Address:</strong> {selected.location || selected.address || 'Not set'}</p>
                <p><strong>Coordinates:</strong> {selected.latitude && selected.longitude 
                  ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` 
                  : 'Not set'}</p>
                {selected.yearsInService !== undefined && selected.yearsInService !== null && (
                  <p><strong>Years in Service:</strong> {selected.yearsInService} years</p>
                )}
              </div>

              {/* Operating Hours Section - mirror shop */}
              <div className="shop-modal-section">
                <h3><FaClock style={{ marginRight: '8px' }} />Operating Hours</h3>
                <p><strong>Opening Time:</strong> {formatTime(selected.workingHours?.startTime) || "Not set"}</p>
                <p><strong>Closing Time:</strong> {formatTime(selected.workingHours?.endTime) || "Not set"}</p>
                {selected.workingDays && Array.isArray(selected.workingDays) && selected.workingDays.length > 0 && (
                  <p><strong>Working Days:</strong> {selected.workingDays.join(", ")}</p>
                )}
              </div>

              {/* Actions - styled like shop */}
              <div className="shop-modal-actions">
                <button className="shop-delete-btn" onClick={() => handleDelete(selected)}>
                  <FaTrash /> Delete Technician
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          confirmText="Delete"
          cancelText="Cancel"
          type={confirmation.type}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}