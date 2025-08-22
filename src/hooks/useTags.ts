import { useQuery } from '@tanstack/react-query';

// Temporary types until tags table exists
export type Tag = {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
};

export type TagInsert = Omit<Tag, 'id' | 'created_at' | 'updated_at'>;
export type TagUpdate = Partial<TagInsert>;

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      // Temporarily return empty array until tags table is created
      return [] as Tag[];
    },
  });
};

export const useSearchTags = (searchTerm: string) => {
  return useQuery({
    queryKey: ['tags', 'search', searchTerm],
    queryFn: async () => {
      // Temporarily return empty array until tags table is created
      return [] as Tag[];
    },
    enabled: !!searchTerm && searchTerm.length > 0,
  });
};

// Temporarily disabled until tags table exists
export const useCreateTag = () => {
  return {
    mutate: () => {},
    isPending: false,
    error: null,
  };
};

export const useUpdateTag = () => {
  return {
    mutate: () => {},
    isPending: false,
    error: null,
  };
};

export const useDeleteTag = () => {
  return {
    mutate: () => {},
    isPending: false,
    error: null,
  };
};

export const useLeadTags = (leadId: string) => {
  return useQuery({
    queryKey: ['leads', leadId, 'tags'],
    queryFn: async () => {
      // Temporarily return empty array until tags table is created
      return [] as Tag[];
    },
    enabled: !!leadId,
  });
};

export const useUpdateLeadTags = () => {
  return {
    mutate: () => {},
    isPending: false,
    error: null,
  };
}; 