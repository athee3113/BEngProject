import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const stageInfoService = {
    async generateStageInfo(stage, role) {
        try {
            const response = await axios.post(`${API_URL}/generateStageInfo`, {
                stage,
                role
            });
            return response.data;
        } catch (error) {
            console.error('Error generating stage info:', error);
            throw error;
        }
    }
}; 