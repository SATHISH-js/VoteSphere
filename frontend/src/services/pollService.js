import api from './api';

export const pollService = {
  // Public actions (no login required)
  async getPublicPoll(idOrSlug) {
    const res = await api.get(`/public/polls/${idOrSlug}`);
    return res.data;
  },

  async castVote(idOrSlug, { optionIds, voterHash }) {
    const res = await api.post(`/public/polls/${idOrSlug}/vote`, {
      optionIds,
      voterHash,
    });
    return res.data;
  },

  async getResults(idOrSlug) {
    const res = await api.get(`/public/polls/${idOrSlug}/results`);
    return res.data;
  },

  // Authenticated actions (require login)
  async createPoll(payload) {
    const res = await api.post('/polls', payload);
    return res.data;
  },

  async getUserPolls() {
    const res = await api.get('/polls');
    return res.data;
  },

  async getPoll(idOrSlug) {
    const res = await api.get(`/polls/${idOrSlug}`);
    return res.data;
  },

  async closePoll(id) {
    const res = await api.post(`/polls/${id}/close`);
    return res.data;
  },

  async deletePoll(id) {
    const res = await api.delete(`/polls/${id}`);
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/polls/stats');
    return res.data;
  },

  async getAnalytics(id) {
    const res = await api.get(`/polls/${id}/analytics`);
    return res.data;
  },
};

export default pollService;
