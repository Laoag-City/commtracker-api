trackerSchema.pre('save', async function (next) {
  const isNew = this.isNew;
  const changes = {};
  
  // If not new, track modified fields
  if (!isNew) {
    const modifiedPaths = this.modifiedPaths();
    for (const path of modifiedPaths) {
      changes[path] = this.get(path); // New value
    }
  }

  // Add audit entry
  this.auditTrail.push({
    action: isNew ? 'create' : 'update',
    modifiedBy: 'system-user', // Replace with actual user information
    changes: isNew ? {} : changes, // Track changes only for updates
  });

  next();
});