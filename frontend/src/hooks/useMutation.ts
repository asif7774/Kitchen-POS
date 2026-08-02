import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import { IPCResponse } from '../lib/ipc';

interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData | undefined, variables: TVariables) => void;
  onError?: (error: string, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: string | null, variables: TVariables) => void;
  successMessage?: string | ((data: TData | undefined, variables: TVariables) => string);
  errorMessage?: string | ((error: string, variables: TVariables) => string);
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<IPCResponse<TData>>,
  options?: MutationOptions<TData, TVariables>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);
  const { showToast } = useToast();

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      
      let response: IPCResponse<TData> | undefined;
      try {
        response = await mutationFn(variables);
        
        if (response.success) {
          setData(response.data);
          
          if (options?.successMessage) {
            const msg = typeof options.successMessage === 'function' 
              ? options.successMessage(response.data, variables)
              : options.successMessage;
            showToast({ message: msg, variant: 'success' });
          }
          
          options?.onSuccess?.(response.data, variables);
          options?.onSettled?.(response.data, null, variables);
          return response.data;
        } 
          const errMsg = response.error ?? 'An unexpected error occurred';
          setError(errMsg);
          
          if (options?.errorMessage) {
            const msg = typeof options.errorMessage === 'function'
              ? options.errorMessage(errMsg, variables)
              : options.errorMessage;
            showToast({ message: msg, variant: 'error' });
          } else {
             // Default error handling if no custom message provided
             showToast({ message: errMsg, variant: 'error' });
          }
          
          options?.onError?.(errMsg, variables);
          options?.onSettled?.(undefined, errMsg, variables);
          throw new Error(errMsg);
        
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errMsg);
        
        // If it wasn't already caught and toasted by the response.success === false block
        if (err instanceof Error && err.message !== response?.error) {
           if (options?.errorMessage) {
             const msg = typeof options.errorMessage === 'function'
               ? options.errorMessage(errMsg, variables)
               : options.errorMessage;
             showToast({ message: msg, variant: 'error' });
           } else {
              showToast({ message: errMsg, variant: 'error' });
           }
        }

        options?.onError?.(errMsg, variables);
        options?.onSettled?.(undefined, errMsg, variables);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options, showToast]
  );

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}
