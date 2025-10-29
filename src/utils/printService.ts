export interface SystemStats {
  totalUsers: number;
  totalTechnicians: number;
  totalShops: number;
  totalFreelancers: number;
  totalAppointments: number;
  pendingAppointments: number;
  acceptedAppointments: number;
  repairingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  activeRepairs: number;
  totalRepairs: number;
  monthlyTrends: Array<{ month: string; count: number }>;
  serviceCategories: Array<{ category: string; count: number }>;
  technicianStats: {
    shop: number;
    freelance: number;
  };
  averageRating: number;
  totalFeedbacks: number;
}

interface CustomReportOptions {
  includeUsers: boolean;
  includeTechnicians: boolean;
  includeAppointments: boolean;
  includeTrends: boolean;
  includeServices: boolean;
  includeCompletedRepairs: boolean;
}

interface FilterOptions {
  dateFilter?: 'all' | 'month' | 'quarter';
}

export class PrintService {
  private static getTimestamp() {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private static generateReportHeader(title: string): string {
    return `
      <div style="text-align: center; border-bottom: 3px solid #333; padding: 20px 0; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 32px; margin: 0 0 10px 0;">I-Repair Platform</h1>
        <h2 style="color: #666; font-size: 22px; margin: 0 0 10px 0; font-weight: 500;">${title}</h2>
        <p style="color: #999; font-size: 14px; margin: 0;">Generated on ${this.getTimestamp()}</p>
      </div>
    `;
  }

  static generateExecutiveSummary(stats: SystemStats, filters: FilterOptions = {}): string {
    const pendingRate = stats.totalAppointments > 0 
      ? ((stats.pendingAppointments / stats.totalAppointments) * 100).toFixed(1)
      : '0';
    const completionRate = stats.totalAppointments > 0
      ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
      : '0';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>I-Repair Executive Summary</title>
    ${this.getPrintStyles()}
</head>
<body>
    ${this.generateReportHeader('Executive Summary Report')}
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #8b5cf6;">
        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">📊 System Overview</h3>
        <p style="color: #666; margin: 0;">Complete system statistics at a glance</p>
    </div>

    <!-- Key Metrics -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
            <tr style="background: #333; color: #fff;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Metric</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Count</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Status</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Users</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #3b82f6;">${stats.totalUsers}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #10b981;">Active</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Technicians</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #f59e0b;">${stats.totalTechnicians}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #10b981;">Approved</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Shops</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #8b5cf6;">${stats.totalShops}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #10b981;">Registered</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Freelancers</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #10b981;">${stats.totalFreelancers}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #10b981;">Active</td>
            </tr>
        </tbody>
    </table>

    <h3 style="color: #333; margin: 30px 0 15px 0;">🔄 Technician Distribution</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
            <tr style="background: #333; color: #fff;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Type</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Count</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Shop-based</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${stats.technicianStats.shop}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${stats.totalTechnicians > 0 ? ((stats.technicianStats.shop / stats.totalTechnicians) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Freelance</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${stats.technicianStats.freelance}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${stats.totalTechnicians > 0 ? ((stats.technicianStats.freelance / stats.totalTechnicians) * 100).toFixed(1) : 0}%</td>
            </tr>
        </tbody>
    </table>

    <!-- Appointments Breakdown -->
    <h3 style="color: #333; margin: 30px 0 15px 0;">📅 Appointments Overview</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
            <tr style="background: #333; color: #fff;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Status</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Count</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Pending</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #ef4444;">${stats.pendingAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${pendingRate}%</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Accepted</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #f59e0b;">${stats.acceptedAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${stats.totalAppointments > 0 ? ((stats.acceptedAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Repairing</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #3b82f6;">${stats.repairingAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${stats.totalAppointments > 0 ? ((stats.repairingAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr style="background: #e8f5e9;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Completed</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #10b981; font-weight: bold;">${stats.completedAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${completionRate}%</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Cancelled</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #9ca3af;">${stats.cancelledAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${stats.totalAppointments > 0 ? ((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Appointments</strong></td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 22px; font-weight: bold;">${stats.totalAppointments}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">100%</td>
            </tr>
        </tbody>
    </table>

    <!-- Active Repairs -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0;">🔧 Active Repairs</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Currently in progress</p>
        <p style="margin: 15px 0 0 0; font-size: 36px; font-weight: bold;">${stats.activeRepairs}</p>
    </div>

    <!-- Performance Summary -->
    <h3 style="color: #333; margin: 30px 0 15px 0;">⭐ User Feedback & Ratings</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Average Rating</h4>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #856404;">${stats.averageRating.toFixed(1)}/5</p>
        </div>
        <div style="background: #d1ecf1; border: 2px solid #0c5460; padding: 15px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">Total Feedbacks</h4>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #0c5460;">${stats.totalFeedbacks}</p>
        </div>
        <div style="background: #d4edda; border: 2px solid #28a745; padding: 15px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">Total Repairs</h4>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #155724;">${stats.totalRepairs}</p>
        </div>
    </div>

    <!-- Performance Summary -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Completion Rate</h4>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #856404;">${completionRate}%</p>
        </div>
        <div style="background: #d4edda; border: 2px solid #28a745; padding: 15px; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">Active Services</h4>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #155724;">${stats.totalShops}</p>
        </div>
    </div>

    ${this.getReportFooter()}
</body>
</html>
    `.trim();
  }

  static generateDetailedAnalytics(stats: SystemStats, filters: FilterOptions = {}): string {
    const html = this.generateExecutiveSummary(stats, filters);
    
    // Add trends section
    const trendsSection = `
    <div style="page-break-before: always;">
      <h3 style="color: #333; margin: 30px 0 15px 0;">📈 12-Month Trends</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #333; color: #fff;">
            <th style="padding: 10px; border: 1px solid #ddd;">Month</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Appointments</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Visual</th>
          </tr>
        </thead>
        <tbody>
          ${stats.monthlyTrends.map((trend, idx) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${trend.month}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold;">${trend.count}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">
                <div style="background: linear-gradient(to right, #667eea ${trend.count}%, transparent ${trend.count}%); height: 25px; border-radius: 4px;"></div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <h3 style="color: #333; margin: 30px 0 15px 0;">🛠️ Service Category Distribution</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #333; color: #fff;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
          <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Count</th>
        </tr>
      </thead>
      <tbody>
        ${stats.serviceCategories.map(cat => `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${cat.category}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${cat.count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `;

    return html.replace('</body>', `${trendsSection}</body>`);
  }

  static generateCustomReport(stats: SystemStats, options: CustomReportOptions, filters: FilterOptions = {}): string {
    let sections: string[] = [];
    
    if (options.includeUsers) {
      sections.push(`
        <h3>👥 Users</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Users:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px;">${stats.totalUsers}</td></tr>
        </table>
      `);
    }
    
    if (options.includeTechnicians) {
      sections.push(`
        <h3>🔧 Technicians (Shops & Freelance)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Technicians:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px;">${stats.totalTechnicians}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Shop-based:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${stats.technicianStats.shop}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Freelance:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${stats.technicianStats.freelance}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Shops:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #8b5cf6;">${stats.totalShops}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Freelancers:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #10b981;">${stats.totalFreelancers}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Average Rating:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px;">${stats.averageRating.toFixed(1)}/5</td></tr>
        </table>
      `);
    }
    
    if (options.includeAppointments) {
      sections.push(`
        <h3>📅 Appointments</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px;">${stats.totalAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;">Pending:</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #ef4444;">${stats.pendingAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;">Accepted:</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #f59e0b;">${stats.acceptedAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;">Repairing:</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #3b82f6;">${stats.repairingAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Completed:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #10b981; font-weight: bold;">${stats.completedAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;">Cancelled:</td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #9ca3af;">${stats.cancelledAppointments}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Active Repairs:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; font-weight: bold;">${stats.activeRepairs}</td></tr>
        </table>
      `);
    }
    
    if (options.includeTrends) {
      sections.push(`
        <h3>📈 Monthly Trends</h3>
        ${this.generateMonthlyTrendTable(stats.monthlyTrends)}
      `);
    }
    
    if (options.includeServices) {
      sections.push(`
        <h3>🛠️ Service Categories</h3>
        ${this.generateServiceCategoryTable(stats.serviceCategories)}
      `);
    }
    
    if (options.includeCompletedRepairs) {
      sections.push(`
        <h3>✅ Completed Repairs</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Completed Repairs:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #10b981; font-weight: bold;">${stats.completedAppointments}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Repairs:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px;">${stats.totalRepairs}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Active Repairs:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; color: #3b82f6;">${stats.activeRepairs}</td></tr>
        </table>
      `);
    }

    // Add Feedback & Ratings if included
    if (stats.totalFeedbacks > 0 || stats.averageRating > 0) {
      sections.push(`
        <h3>⭐ Feedback & Ratings</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Average Rating:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px; color: #ffc107;">${stats.averageRating.toFixed(1)}/5 ⭐</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Feedbacks:</strong></td><td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 20px;">${stats.totalFeedbacks}</td></tr>
        </table>
      `);
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${this.getPrintStyles()}
</head>
<body>
  ${this.generateReportHeader('Custom System Report')}
  ${sections.join('<div style="page-break-before: always;"></div>')}
  ${this.getReportFooter()}
</body>
</html>
    `.trim();
  }

  private static generateMonthlyTrendTable(trends: Array<{ month: string; count: number }>): string {
    return `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #333; color: #fff;">
            <th style="padding: 10px; border: 1px solid #ddd;">Month</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Count</th>
          </tr>
        </thead>
        <tbody>
          ${trends.map(t => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${t.month}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${t.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private static generateServiceCategoryTable(categories: Array<{ category: string; count: number }>): string {
    return `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #333; color: #fff;">
            <th style="padding: 10px; border: 1px solid #ddd;">Category</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Count</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(c => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${c.category}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${c.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private static getPrintStyles(): string {
    return `
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          @page { margin: 1cm; }
        }
        body {
          font-family: 'Arial', sans-serif;
          color: #000;
          background: #fff;
          padding: 20px;
        }
        h1, h2, h3, h4 { color: #333; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #ddd; }
      </style>
    `;
  }

  private static getReportFooter(): string {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px;">
        <p>© 2025 I-Repair Platform. All rights reserved.</p>
        <p>Confidential Report - For Internal Use Only</p>
      </div>
    `;
  }

  static async printExecutiveSummary(stats: SystemStats, filters: FilterOptions = {}) {
    const html = this.generateExecutiveSummary(stats, filters);
    await this.printHTML(html);
  }

  static async printDetailedAnalytics(stats: SystemStats, filters: FilterOptions = {}) {
    const html = this.generateDetailedAnalytics(stats, filters);
    await this.printHTML(html);
  }

  static async printCustomReport(stats: SystemStats, options: CustomReportOptions, filters: FilterOptions = {}) {
    const html = this.generateCustomReport(stats, options, filters);
    await this.printHTML(html);
  }

  static downloadExecutiveSummary(stats: SystemStats, filters: FilterOptions = {}) {
    const html = this.generateExecutiveSummary(stats, filters);
    this.downloadHTML(html, 'irepair-executive-summary.html');
  }

  static downloadDetailedAnalytics(stats: SystemStats, filters: FilterOptions = {}) {
    const html = this.generateDetailedAnalytics(stats, filters);
    this.downloadHTML(html, 'irepair-detailed-analytics.html');
  }

  static downloadCustomReport(stats: SystemStats, options: CustomReportOptions, filters: FilterOptions = {}) {
    const html = this.generateCustomReport(stats, options, filters);
    this.downloadHTML(html, 'irepair-custom-report.html');
  }

  private static async printHTML(html: string) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print reports');
      return;
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      }, 250);
    };
  }

  private static downloadHTML(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.html', `-${timestamp}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
