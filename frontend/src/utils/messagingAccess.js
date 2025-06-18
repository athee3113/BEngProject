// Utility to determine allowed message recipients based on sender role
// Usage: getAllowedRecipientsForRole(senderRole, property, usersByRole)

export function getAllowedRecipientsForRole(senderRole, property, usersByRole, senderId) {
  if (!senderRole || !property) return [];
  
  // Debug logs
  console.log('DEBUG: usersByRole:', usersByRole);
  console.log('DEBUG: property:', property);
  console.log('DEBUG: senderRole:', senderRole);
  console.log('DEBUG: senderId:', senderId);

  // Helper to assign property-specific role
  function getPropertyRole(user, property) {
    if (!user || !user.role) return '';
    let r = user.role.toLowerCase();
    // Ensure both IDs are numbers for comparison
    const userId = Number(user.id);
    const buyerSolId = Number(property.buyer_solicitor_id);
    const sellerSolId = Number(property.seller_solicitor_id);
    if (r === 'solicitor') {
      if (userId === buyerSolId) return 'buyer solicitor';
      if (userId === sellerSolId) return 'seller solicitor';
      return 'solicitor';
    }
    if (r === 'estate_agent') return 'estate agent';
    if (r === 'seller') return 'seller';
    if (r === 'buyer') return 'buyer';
    return r;
  }

  // Find the sender in usersByRole and get their property-specific role
  const sender = usersByRole.find(u => u.id === senderId);
  const role = getPropertyRole(sender, property);
  console.log('DEBUG: sender mapped to property role:', role);

  const allowedRecipients = usersByRole.filter(u => {
    const recipientRole = getPropertyRole(u, property);
    console.log(`DEBUG: user ${u.id} (${u.role}) mapped to property role: ${recipientRole}`);
    
    if (role === 'buyer') {
      return recipientRole === 'buyer solicitor' || recipientRole === 'estate agent' || recipientRole === 'seller';
    }
    if (role === 'seller') {
      return recipientRole === 'seller solicitor' || recipientRole === 'estate agent' || recipientRole === 'buyer';
    }
    if (role === 'buyer solicitor') {
      return recipientRole === 'buyer' || recipientRole === 'seller solicitor' || recipientRole === 'estate agent';
    }
    if (role === 'seller solicitor') {
      return recipientRole === 'seller' || recipientRole === 'buyer solicitor' || recipientRole === 'estate agent';
    }
    if (role === 'estate agent') {
      return (
        recipientRole === 'buyer' ||
        recipientRole === 'seller' ||
        recipientRole === 'buyer solicitor' ||
        recipientRole === 'seller solicitor'
      );
    }
    return false;
  });

  console.log('DEBUG: allowedRecipients:', allowedRecipients);
  return allowedRecipients;
} 