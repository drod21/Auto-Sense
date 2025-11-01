// API Configuration
// Update this URL to your Replit backend URL when testing
// For local development, use your computer's IP address
export const API_BASE_URL = __DEV__ 
  ? 'https://YOUR_REPLIT_URL.repl.co' // Update this!
  : 'https://YOUR_PRODUCTION_URL.com';

export const apiClient = {
  // Check if user is authenticated
  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        credentials: 'include', // Important for session cookies
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
      credentials: 'include', // Important for session cookies
    });

    if (!response.ok) {
      throw new Error('Not authenticated');
    }

    return response.json();
  },

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async uploadFile(endpoint: string, file: { uri: string; name: string; type: string }): Promise<any> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    formData.append('workoutName', file.name.replace(/\.(csv|xlsx|xls)$/i, ''));

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
      // Don't set Content-Type header - let fetch set it automatically with the boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
  },
};
