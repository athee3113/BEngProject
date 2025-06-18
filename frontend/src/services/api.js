const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; 
// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Something went wrong');
  }
  return response.json();
};

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    
   
    if (!data.access_token) {
      throw new Error('No access token received');
    }

    // Store the access token
    localStorage.setItem('token', data.access_token);

    // Get the stored user info from signup
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    // Store user info from the response or use stored info
    let userInfoToStore = null;
    
    // Check all possible locations for user data in the response
    if (data.user && data.user.id) {
      userInfoToStore = data.user;
    } else if (data.user && data.user.email) {
      // If user object exists but no id, fetch from API
      try {
        const userResponse = await fetch(`${API_URL}/users/${data.user.email}`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        const userData = await handleResponse(userResponse);
        if (userData.id) {
          userInfoToStore = userData;
        }
      } catch (error) {
      }
    } else if (data.firstName && data.lastName && data.email) {
      // If root fields exist, fetch from API
      try {
        const userResponse = await fetch(`${API_URL}/users/${data.email}`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        const userData = await handleResponse(userResponse);
        if (userData.id) {
          userInfoToStore = userData;
        }
      } catch (error) {
      }
    } else if (storedUserInfo.email) {
      // Try to fetch by stored email
      try {
        const userResponse = await fetch(`${API_URL}/users/${storedUserInfo.email}`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        const userData = await handleResponse(userResponse);
        if (userData.id) {
          userInfoToStore = userData;
        }
      } catch (error) {
      }
    } else {
      // Try to get it from the token
      try {
        const tokenParts = data.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.email) {
            const userResponse = await fetch(`${API_URL}/users/${payload.email}`, {
              headers: {
                'Authorization': `Bearer ${data.access_token}`
              }
            });
            const userData = await handleResponse(userResponse);
            if (userData.id) {
              userInfoToStore = userData;
            }
          }
        }
      } catch (error) {
      }
    }
    
    if (userInfoToStore && userInfoToStore.id) {
      localStorage.setItem('userInfo', JSON.stringify(userInfoToStore));
    }
    
    return data;
  },

  // Signup user
  signup: async (firstName, lastName, email, password, role) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        first_name: firstName,
        last_name: lastName,
        email, 
        password,
        role
      }),
    });
    const data = await handleResponse(response);
    
    // Store user info in localStorage
    const userInfo = {
      firstName,
      lastName,
      email,
      role
    };
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    return data;
  },
};

// File API calls
export const fileAPI = {
  // Upload file
  uploadFile: async (formData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  },

  // Get files for a property
  getPropertyFiles: async (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/files?property_id=${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  // Get specific file
  getFile: async (fileId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  // Delete file
  deleteFile: async (fileId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete file');
  },

  // Download file
  downloadFile: async (fileId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch(`${API_URL}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to download file');
    
    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'downloaded-file';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
  },

  // Update file notes
  updateFileNotes: async (fileId, notes) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch(`${API_URL}/files/${fileId}/notes`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    
    if (!response.ok) throw new Error('Failed to update notes');
    return response.json();
  },

  // Update file review status
  updateFileReview: async (fileId, reviewStatus) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    // Map frontend status to backend enum (all lowercase)
    let backendStatus = reviewStatus;
    if (reviewStatus === 'accepted') backendStatus = 'approved';
    if (reviewStatus === 'denied') backendStatus = 'denied';
    if (reviewStatus === 'pending') backendStatus = 'pending';
    const response = await fetch(`${API_URL}/files/${fileId}/review`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ review_status: backendStatus }),
    });
    if (!response.ok) throw new Error('Failed to update review status');
    return response.json();
  },

  // Update file expiry date
  updateFileExpiry: async (fileId, expiresAt) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/files/${fileId}/expiry`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_at: expiresAt }),
    });
    if (!response.ok) throw new Error('Failed to update expiry date');
    return response.json();
  },
};

// Property Stages API
export const propertyStageAPI = {
  getPropertyStages: async (propertyId) => {
    const response = await fetch(`${API_URL}/properties/${propertyId}/stages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch property stages');
    return response.json();
  },

  updatePropertyStage: async (propertyId, stageId, stageData) => {
    const response = await fetch(`${API_URL}/properties/${propertyId}/stages/${stageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stageData)
    });
    if (!response.ok) throw new Error('Failed to update property stage');
    return response.json();
  },

  createPropertyStage: async (propertyId, stageData) => {
    const response = await fetch(`${API_URL}/properties/${propertyId}/stages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stageData)
    });
    if (!response.ok) throw new Error('Failed to create property stage');
    return response.json();
  },

  deletePropertyStage: async (propertyId, stageId) => {
    const response = await fetch(`${API_URL}/properties/${propertyId}/stages/${stageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete property stage');
    return response.json();
  },

  approveTimeline: async (propertyId, isBuyerSolicitor, comment = null) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/timeline-approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approved: true,
          comment: comment
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          if (data.detail === 'Timeline is already locked and cannot be modified') {
            throw new Error('Timeline is already locked and cannot be modified');
          } else if (data.detail.includes('already approved')) {
            throw new Error('You have already approved this timeline');
          }
        } else if (response.status === 403) {
          throw new Error('You are not authorized to approve this timeline');
        } else if (response.status === 404) {
          throw new Error('Property not found');
        }
        throw new Error(data.detail || 'Failed to approve timeline');
      }
      
      return data;
    } catch (error) {
      console.error('Error in approveTimeline:', error);
      throw error;
    }
  },

  unlockTimeline: async (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/properties/${propertyId}/unlock-timeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Failed to unlock timeline');
    }
    return response.json();
  },
};

// Message API calls
export const messageAPI = {
  // Send a message (generic, legacy)
  sendMessage: async (sender_id, recipient_id, property_id, stage_id, content) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await fetch(
      `${API_URL}/messages/send?sender_id=${sender_id}&recipient_id=${recipient_id}&property_id=${property_id}&stage_id=${stage_id}&content=${encodeURIComponent(content)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return handleResponse(response);
  },

  // Send a buyer-seller message (AI filtered, agent approval)
  sendBuyerSellerMessage: async (propertyId, stageId, content) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/stages/${stageId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      }
    );
    return handleResponse(response);
  },

  // Get messages for a property
  getAllPropertyMessages: async (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/properties/${propertyId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  // Get pending messages for a property
  getPendingMessages: async (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/properties/${propertyId}/pending-messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  // Approve a message (choose version: 'original' or 'filtered')
  approveMessageVersion: async (propertyId, messageId, version) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(
      `${API_URL}/properties/${propertyId}/messages/${messageId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version }),
      }
    );
    return handleResponse(response);
  },

  // Reject a message
  rejectMessage: async (messageId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/messages/reject/${messageId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },
};

export const userAPI = {
  getUser: async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    if (userId === undefined || userId === null) {
      throw new Error('Invalid userId');
    }
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }
};

export const propertyAPI = {
  getProperty: async (propertyId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/properties/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch property');
    return response.json();
  },
}; 