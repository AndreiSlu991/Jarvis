import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useGet(key, url, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => (await api.get(url)).data,
    ...options
  });
}

export function useAction({ method = 'post', url, invalidate = [], successMessage } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ url: overrideUrl, data } = {}) =>
      (await api[method](overrideUrl || url, data)).data,
    onSuccess: () => {
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }));
      if (successMessage) toast.success(successMessage);
    },
    onError: (err) => toast.error(err.message)
  });
}
