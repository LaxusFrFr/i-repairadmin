import { db } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export interface ReportData {
  id?: string;
  technicianId: string;
  userId: string;
  appointmentId: string;
  reason: string;
  createdAt: any;
  status?: 'pending' | 'reviewed' | 'resolved';
}

export interface TechnicianReportStats {
  totalReports: number;
  isBlocked: boolean;
  blockedAt?: any;
  blockedReason?: string;
}

export class ReportService {
  /**
   * Submit a report against a technician
   */
  static async submitReport(
    technicianId: string,
    userId: string,
    appointmentId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Add report to reports collection
      await addDoc(collection(db, 'reports'), {
        technicianId,
        userId,
        appointmentId,
        reason: reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Update technician report count and check for blocking
      await this.updateTechnicianReportCount(technicianId);
      
      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  /**
   * Get all reports for a specific technician
   */
  static async getTechnicianReports(technicianId: string): Promise<ReportData[]> {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('technicianId', '==', technicianId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(reportsQuery);
      const reports: ReportData[] = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        } as ReportData);
      });
      
      return reports;
    } catch (error) {
      console.error('Error fetching technician reports:', error);
      throw error;
    }
  }

  /**
   * Get all reports (for admin)
   */
  static async getAllReports(): Promise<ReportData[]> {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(reportsQuery);
      const reports: ReportData[] = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        } as ReportData);
      });
      
      return reports;
    } catch (error) {
      console.error('Error fetching all reports:', error);
      throw error;
    }
  }

  /**
   * Update technician report count and check for blocking
   */
  static async updateTechnicianReportCount(technicianId: string): Promise<void> {
    try {
      // Get current reports count
      const reports = await this.getTechnicianReports(technicianId);
      const totalReports = reports.length;
      
      // Get technician document
      const technicianRef = doc(db, 'technicians', technicianId);
      const technicianDoc = await getDoc(technicianRef);
      
      if (technicianDoc.exists()) {
        const currentData = technicianDoc.data();
        const isCurrentlyBlocked = currentData.isBlocked || false;
        
        // Check if technician should be blocked (5 or more reports)
        const shouldBeBlocked = totalReports >= 5;
        
        // Update technician document
        const updateData: any = {
          totalReports,
          lastReportUpdate: serverTimestamp(),
        };
        
        // Block technician if they have 5+ reports and aren't already blocked
        if (shouldBeBlocked && !isCurrentlyBlocked) {
          updateData.isBlocked = true;
          updateData.blockedAt = serverTimestamp();
          updateData.blockedReason = `Automatically blocked due to ${totalReports} reports`;
          console.log(`🚫 Technician ${technicianId} blocked due to ${totalReports} reports`);
        }
        
        await updateDoc(technicianRef, updateData);
      } else {
        console.warn(`Technician with ID ${technicianId} not found.`);
      }
    } catch (error) {
      console.error('Error updating technician report count:', error);
      throw error;
    }
  }

  /**
   * Check if technician is blocked
   */
  static async isTechnicianBlocked(technicianId: string): Promise<boolean> {
    try {
      const technicianRef = doc(db, 'technicians', technicianId);
      const technicianDoc = await getDoc(technicianRef);
      
      if (technicianDoc.exists()) {
        const data = technicianDoc.data();
        return data.isBlocked || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking technician blocking status:', error);
      return false;
    }
  }

  /**
   * Get technician report statistics
   */
  static async getTechnicianReportStats(technicianId: string): Promise<TechnicianReportStats> {
    try {
      const technicianRef = doc(db, 'technicians', technicianId);
      const technicianDoc = await getDoc(technicianRef);
      
      if (technicianDoc.exists()) {
        const data = technicianDoc.data();
        return {
          totalReports: data.totalReports || 0,
          isBlocked: data.isBlocked || false,
          blockedAt: data.blockedAt,
          blockedReason: data.blockedReason,
        };
      }
      
      return {
        totalReports: 0,
        isBlocked: false,
      };
    } catch (error) {
      console.error('Error fetching technician report stats:', error);
      return {
        totalReports: 0,
        isBlocked: false,
      };
    }
  }

  /**
   * Manually block/unblock technician (for admin)
   */
  static async setTechnicianBlocked(
    technicianId: string, 
    isBlocked: boolean, 
    reason?: string
  ): Promise<void> {
    try {
      const technicianRef = doc(db, 'technicians', technicianId);
      const updateData: any = {
        isBlocked,
        lastBlockUpdate: serverTimestamp(),
      };
      
      if (isBlocked) {
        updateData.blockedAt = serverTimestamp();
        updateData.blockedReason = reason || 'Manually blocked by admin';
      } else {
        updateData.unblockedAt = serverTimestamp();
        updateData.unblockedReason = reason || 'Manually unblocked by admin';
      }
      
      await updateDoc(technicianRef, updateData);
    } catch (error) {
      console.error('Error setting technician blocked status:', error);
      throw error;
    }
  }

  /**
   * Update report status (for admin)
   */
  static async updateReportStatus(
    reportId: string, 
    status: 'pending' | 'reviewed' | 'resolved'
  ): Promise<void> {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }
}


