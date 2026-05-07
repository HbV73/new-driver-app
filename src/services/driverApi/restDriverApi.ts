import type {
  DriverApi,
  DriverApiContext,
  DriverApiResult,
  DriverInventory,
  DriverMessage,
  ProofOfCollectionInput,
  SubmitExpenseInput,
  UpdateStopStatusInput,
} from './types';

const baseUrl = import.meta.env.VITE_DRIVER_API_BASE_URL;

function notImplemented(operation: string): never {
  throw new Error(
    `REST Driver API adapter is selected but ${operation} is not implemented yet. ` +
      `Set VITE_DRIVER_API_PROVIDER=supabase until the backend is available.`,
  );
}

function ensureBaseUrl() {
  if (!baseUrl) {
    throw new Error('VITE_DRIVER_API_BASE_URL is required when VITE_DRIVER_API_PROVIDER=rest.');
  }
}

export const restDriverApi: DriverApi = {
  async getTodayRoute(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getTodayRoute');
  },

  async getRouteByDate(_context: DriverApiContext, _routeDate: string) {
    ensureBaseUrl();
    return notImplemented('getRouteByDate');
  },

  async updateStopStatus(_context: DriverApiContext, _input: UpdateStopStatusInput): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('updateStopStatus');
  },

  async submitProofOfCollection(_input: ProofOfCollectionInput): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('submitProofOfCollection');
  },

  async getInventory(_context: DriverApiContext): Promise<DriverInventory | null> {
    ensureBaseUrl();
    return notImplemented('getInventory');
  },

  async getMessages(_context: DriverApiContext): Promise<DriverMessage[]> {
    ensureBaseUrl();
    return notImplemented('getMessages');
  },

  async markMessageRead(_context: DriverApiContext, _messageId: string): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('markMessageRead');
  },

  async sendMessageReply(_context: DriverApiContext, _messageText: string): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('sendMessageReply');
  },

  async getExpenses(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getExpenses');
  },

  async submitExpense(_context: DriverApiContext, _input: SubmitExpenseInput): Promise<DriverApiResult> {
    ensureBaseUrl();
    return notImplemented('submitExpense');
  },

  async getLeaveRequests(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getLeaveRequests');
  },

  async submitLeaveRequest(_context: DriverApiContext, _input) {
    ensureBaseUrl();
    return notImplemented('submitLeaveRequest');
  },

  async getDriverPerformance(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getDriverPerformance');
  },

  async getFahrernachweis(_context: DriverApiContext) {
    ensureBaseUrl();
    return notImplemented('getFahrernachweis');
  },
};
