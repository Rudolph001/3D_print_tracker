// Clean, simplified order report template
const generateCleanReportHTML = (order, totalParts, totalTime, completedPrints, progressPercentage, remainingTime, estimatedCompletion, isCompleted) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order ${order.orderNumber} - Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #1e293b;
      line-height: 1.6;
      padding: 40px 20px;
      min-height: 100vh;
    }

    .document {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
    }

    .document::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 60px 40px;
      position: relative;
      overflow: hidden;
      text-align: center;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
      z-index: 1;
    }

    .header-content {
      position: relative;
      z-index: 2;
      max-width: 600px;
      margin: 0 auto;
    }

    .company-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .company-logo {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: white;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
      flex-shrink: 0;
    }

    .company-info {
      text-align: left;
    }

    .company-name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }

    .company-tagline {
      font-size: 14px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 400;
    }

    .order-header {
      margin-top: 20px;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .order-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .status-header {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border: 1px solid #e2e8f0;
      padding: 40px;
      margin: 40px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .status-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 16px 16px 0 0;
    }

    .status-badge-large {
      display: inline-block;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .status-badge-large.queued {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 2px solid #f59e0b;
    }

    .status-badge-large.in_progress {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #1e40af;
      border: 2px solid #3b82f6;
    }

    .status-badge-large.completed {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #15803d;
      border: 2px solid #22c55e;
    }

    .completion-badge {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      padding: 20px 30px;
      text-align: center;
      color: #475569;
      font-weight: 600;
      font-size: 16px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .completion-badge::before {
      content: '📅';
      margin-right: 12px;
      font-size: 18px;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding: 0 30px 30px;
    }

    .info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .info-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .info-title {
      font-weight: 700;
      color: #667eea;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .info-content {
      color: #374151;
      line-height: 1.7;
    }

    .info-content strong {
      color: #1f2937;
      font-weight: 600;
    }

    .schedule-section {
      margin: 0 30px 30px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    .schedule-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      font-weight: 700;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .schedule-header::before {
      content: '📋';
      font-size: 20px;
    }

    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      font-size: 14px;
    }

    .schedule-table th {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      padding: 16px 24px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #667eea;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      position: relative;
    }

    .schedule-table td {
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;
      color: #374151;
      font-weight: 500;
    }

    .schedule-table tr:last-child td {
      border-bottom: none;
    }

    .schedule-table tr:nth-child(even) {
      background: #fafbfc;
    }

    .schedule-table tr:hover {
      background: #f1f5f9;
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-queued {
      background: #fef3c7;
      color: #92400e;
    }

    .progress-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 30px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .progress-item {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .progress-value {
      font-size: 36px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    @media print {
      body { 
        background: white; 
        padding: 0; 
      }
      .document { 
        box-shadow: none; 
        margin: 0;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document">
    <!-- HEADER -->
    <div class="header">
      <div class="header-content">
        <div class="company-brand">
          <div class="company-logo">P3D</div>
          <div class="company-info">
            <div class="company-name">PRECISION 3D PRINT</div>
            <div class="company-tagline">Professional Manufacturing Excellence</div>
          </div>
        </div>
        <div class="order-header">
          <div class="order-badge">Order #${order.orderNumber || 'ORD-' + order.id.toString().padStart(6, '0')}</div>
        </div>
      </div>
    </div>

    <!-- STATUS HEADER -->
    <div class="status-header">
      <div class="status-badge-large status-${order.status}">${order.status.replace('_', ' ').toUpperCase()}</div>
      <div class="completion-badge">
      ${isCompleted 
        ? 'Order Completed Successfully' 
        : `Estimated Completion: ${estimatedCompletion.toLocaleDateString('en-ZA', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}`
      }
    </div>

    <!-- INFO CARDS -->
    <div class="info-section">
      <div class="info-card">
        <div class="info-title">👤 Customer Details</div>
        <div class="info-content">
          <strong>${order.customer.name}</strong><br>
          📱 ${order.customer.whatsappNumber}<br>
          📅 Ordered: ${new Date(order.createdAt).toLocaleDateString('en-ZA', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">📊 Order Summary</div>
        <div class="info-content">
          <strong>${order.prints.length}</strong> Print Job${order.prints.length > 1 ? 's' : ''}<br>
          <strong>${totalParts}</strong> Total Parts<br>
          <strong>${totalTime.toFixed(2)}h</strong> Production Time<br>
          <strong>Invoice:</strong> INV ${order.id.toString().padStart(6, '0')}<br>
          <strong>Reference:</strong> ERF ${Math.floor(Math.random() * 9000) + 1000}
        </div>
      </div>
    </div>

    <!-- PRODUCTION SCHEDULE -->
    <div class="schedule-section">
      <div class="schedule-header">Production Schedule</div>
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Material</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${order.prints.map((print) => `
            <tr>
              <td><strong>${print.name}</strong> (${print.quantity} pieces, ${print.quantity} plates)</td>
              <td>${print.quantity}x</td>
              <td>${print.material}</td>
              <td>${(parseFloat(print.estimatedTime) * print.quantity).toFixed(1)}h</td>
              <td><span class="status-badge status-${print.status}">${print.status.toUpperCase()}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- PROGRESS SUMMARY -->
    <div class="progress-section">
      <div class="progress-item">
        <div class="progress-value">${completedPrints}/${order.prints.length}</div>
        <div class="progress-label">Completed</div>
      </div>
      <div class="progress-item">
        <div class="progress-value">${progressPercentage}%</div>
        <div class="progress-label">Progress</div>
      </div>
      <div class="progress-item">
        <div class="progress-value">${remainingTime.toFixed(1)}h</div>
        <div class="progress-label">Remaining</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = generateCleanReportHTML;