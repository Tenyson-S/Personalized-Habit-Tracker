export const CACHE_POLICIES = {
  profile: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (formerly cacheTime)
  },
  settings: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  interests: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  habits: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  dailies: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  tasks: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  today: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 2 * 24 * 60 * 60 * 1000, // 2 days
  },
  village: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  journey: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
  analytics: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 7 * 24 * 60 * 60 * 1000, 
  },
};
