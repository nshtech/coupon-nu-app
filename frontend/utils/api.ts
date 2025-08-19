const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const deleteAccountAPI = async (accessToken: string) => {
    
    try {
        const response = await fetch(`${BASE_URL}/api/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Error data:', errorData);
            throw new Error(errorData.detail || 'Failed to delete account');
        }

        const result = await response.json();
        console.log('Delete account successful:', result);
        return result;
    } catch (error) {
        console.error('Network error details:', error);
        throw error;
    }
};
