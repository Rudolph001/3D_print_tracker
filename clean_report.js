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
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 40px 20px;
    }

    .document {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .completion-badge {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 24px;
      margin: 30px;
      text-align: center;
      color: #475569;
      font-weight: 500;
    }

    .completion-badge::before {
      content: '📅';
      margin-right: 8px;
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding: 0 30px 30px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
    }

    .info-title {
      font-weight: 600;
      color: #6366f1;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
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
    }

    .schedule-header {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 16px 24px;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .schedule-header::before {
      content: '📋';
    }

    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }

    .schedule-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .schedule-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #374151;
    }

    .schedule-table tr:last-child td {
      border-bottom: none;
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
    <!-- COMPLETION BADGE -->
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