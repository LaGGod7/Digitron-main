export default function AdminActivityTab({ activityLogs = [], limit = 5 }) {
  const displayLogs = limit ? activityLogs.slice(0, limit) : activityLogs;

  return (
    <div className="admin-card" style={{ margin: 0 }}>
      <h3 className="admin-card-title">System Activity Log</h3>
      <div className="activity-log">
        {displayLogs.map(log => (
          <div key={log.id} className="activity-log-item">
            <span className={`activity-log-dot ${log.type}`} />
            <div className="activity-log-body">
              <div className="activity-log-action">{log.action}</div>
              <div className="activity-log-time">
                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.time).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
