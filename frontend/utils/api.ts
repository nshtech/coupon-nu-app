const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// a hung request would leave Delete Account spinning forever
const REQUEST_TIMEOUT_MS = 20000;

export const deleteAccountAPI = async (accessToken: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE_URL}/api/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to delete account (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error('Delete account request failed:', error);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};
