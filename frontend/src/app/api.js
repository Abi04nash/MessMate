import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "/api/v1",
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrf = getCsrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
    return headers;
  }
});

const NO_REFRESH_URLS = ["/auth/refresh", "/auth/login", "/auth/logout", "/auth/register"];
const shouldSkipRefresh = (url) => NO_REFRESH_URLS.some((u) => url.includes(u));

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url || "";
    if (shouldSkipRefresh(url)) return result;
    const refresh = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
    if (refresh.data) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch({ type: "auth/clearUser" });
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth","Menu","MenuList","Registration","Attendance","Bill","Payment","Complaint","Leave","Refund","User","Announcement","Feedback","Inventory","InventoryRequest","Wastage","Setting"],
  endpoints: (builder) => ({
    me: builder.query({ query: () => "/auth/me", providesTags: ["Auth"] }),
    login: builder.mutation({ query: (body) => ({ url: "/auth/login", method: "POST", body }), invalidatesTags: ["Auth"] }),
    register: builder.mutation({ query: (body) => ({ url: "/auth/register", method: "POST", body }) }),
    logout: builder.mutation({ query: () => ({ url: "/auth/logout", method: "POST" }), invalidatesTags: ["Auth"] }),

    todayMenu: builder.query({ query: () => "/menus/today", providesTags: ["Menu"] }),
    upcomingMenus: builder.query({
      query: (params = {}) => {
        const p = new URLSearchParams();
        if (params.page) p.set("page", params.page);
        if (params.limit) p.set("limit", params.limit);
        if (params.days) p.set("days", params.days);
        return "/menus/upcoming?" + p.toString();
      },
      providesTags: ["MenuList"]
    }),
    listMenus: builder.query({ query: (params) => ({ url: "/menus", params }), providesTags: ["MenuList"] }),
    menuDetail: builder.query({ query: (id) => "/menus/" + id, providesTags: ["MenuList"] }),
    createMenu: builder.mutation({ query: (body) => ({ url: "/menus", method: "POST", body }), invalidatesTags: ["Menu","MenuList"] }),
    updateMenu: builder.mutation({ query: ({ id, ...body }) => ({ url: "/menus/" + id, method: "PUT", body }), invalidatesTags: ["Menu","MenuList"] }),
    deleteMenu: builder.mutation({ query: (id) => ({ url: "/menus/" + id, method: "DELETE" }), invalidatesTags: ["Menu","MenuList"] }),

    registerMeal: builder.mutation({
      query: (body) => ({ url: "/registrations", method: "POST", body }),
      invalidatesTags: ["Menu","MenuList","Registration","Bill"]
    }),
    cancelRegistration: builder.mutation({
      query: (id) => ({ url: "/registrations/" + id, method: "DELETE" }),
      invalidatesTags: ["Menu","MenuList","Registration","Bill"]
    }),
    myRegistrations: builder.query({ query: () => "/registrations/my", providesTags: ["Registration"] }),
    sessionRegistrations: builder.query({ query: (sessionId) => "/registrations/session/" + sessionId, providesTags: ["Registration"] }),

    generateQr: builder.mutation({ query: (body) => ({ url: "/attendance/qr/generate", method: "POST", body }) }),
    verifyQr: builder.mutation({ query: (body) => ({ url: "/attendance/qr/verify", method: "POST", body }), invalidatesTags: ["Attendance"] }),
    manualCheckIn: builder.mutation({
      query: (body) => ({ url: "/attendance/manual", method: "POST", body }),
      invalidatesTags: ["Attendance","Registration"]
    }),
    myAttendance: builder.query({ query: () => "/attendance/my", providesTags: ["Attendance"] }),

    runningBill: builder.query({ query: () => "/billing/running", providesTags: ["Bill"] }),
    billingDebug: builder.query({ query: () => "/billing/debug", providesTags: ["Bill","Payment"] }),
    resetPayments: builder.mutation({
      query: () => ({ url: "/billing/reset-payments", method: "POST" }),
      invalidatesTags: ["Bill","Payment"]
    }),
    myBills: builder.query({ query: () => "/billing/my", providesTags: ["Bill"] }),
    payDirect: builder.mutation({
      query: (body) => ({ url: "/payments/pay", method: "POST", body }),
      invalidatesTags: ["Bill","Payment"]
    }),
    initiatePayment: builder.mutation({
      query: (body) => ({ url: "/payments/initiate", method: "POST", body }),
      invalidatesTags: ["Bill","Payment"]
    }),
    myPayments: builder.query({ query: () => "/payments/my", providesTags: ["Payment"] }),
    allPayments: builder.query({ query: (params) => ({ url: "/payments", params }), providesTags: ["Payment"] }),

    myComplaints: builder.query({ query: () => "/complaints/my", providesTags: ["Complaint"] }),
    createComplaint: builder.mutation({ query: (body) => ({ url: "/complaints", method: "POST", body }), invalidatesTags: ["Complaint"] }),
    allComplaints: builder.query({ query: (params) => ({ url: "/complaints", params }), providesTags: ["Complaint"] }),
    updateComplaintStatus: builder.mutation({ query: ({ id, ...body }) => ({ url: "/complaints/" + id + "/status", method: "PATCH", body }), invalidatesTags: ["Complaint"] }),

    createRefund: builder.mutation({ query: (body) => ({ url: "/leaves/refunds", method: "POST", body }), invalidatesTags: ["Refund"] }),
    myRefunds: builder.query({ query: () => "/leaves/refunds/my", providesTags: ["Refund"] }),
    allRefunds: builder.query({ query: (params) => ({ url: "/leaves/refunds", params }), providesTags: ["Refund"] }),

    myLeaves: builder.query({ query: () => "/leaves/my", providesTags: ["Leave"] }),
    createLeave: builder.mutation({ query: (body) => ({ url: "/leaves", method: "POST", body }), invalidatesTags: ["Leave"] }),
    allLeaves: builder.query({ query: (params) => ({ url: "/leaves", params }), providesTags: ["Leave"] }),
    decideLeave: builder.mutation({ query: ({ id, ...body }) => ({ url: "/leaves/" + id + "/decide", method: "PATCH", body }), invalidatesTags: ["Leave","Refund"] }),
    cancelRequest: builder.mutation({ query: (id) => ({ url: "/leaves/" + id, method: "DELETE" }), invalidatesTags: ["Leave","Refund"] }),

    listUsers: builder.query({ query: (params) => ({ url: "/users", params }), providesTags: ["User"] }),
    setUserStatus: builder.mutation({ query: ({ id, status }) => ({ url: "/users/" + id + "/status", method: "PATCH", body: { status } }), invalidatesTags: ["User"] }),
    listAnnouncements: builder.query({ query: () => "/announcements", providesTags: ["Announcement"] }),
    createAnnouncement: builder.mutation({ query: (body) => ({ url: "/announcements", method: "POST", body }), invalidatesTags: ["Announcement"] }),
    myNotifications: builder.query({ query: () => "/notifications/my", providesTags: ["Auth"] }),

    submitFeedback: builder.mutation({ query: (body) => ({ url: "/feedback", method: "POST", body }), invalidatesTags: ["Feedback"] }),
    myFeedback: builder.query({ query: () => "/feedback/my", providesTags: ["Feedback"] }),
    allFeedback: builder.query({ query: (params) => ({ url: "/feedback", params }), providesTags: ["Feedback"] }),
    feedbackStats: builder.query({ query: () => "/feedback/stats", providesTags: ["Feedback"] }),

    listWastage: builder.query({ query: () => "/wastage", providesTags: ["Wastage"] }),
    myWastage: builder.query({ query: () => "/wastage/my", providesTags: ["Wastage"] }),
    createWastage: builder.mutation({ query: (body) => ({ url: "/wastage", method: "POST", body }), invalidatesTags: ["Wastage"] }),
    wastageStats: builder.query({ query: () => "/wastage/stats", providesTags: ["Wastage"] }),
    groundFloorInfo: builder.query({ query: () => "/ground-floor/info", providesTags: ["Auth","Bill"] }),
    groundFloorEnroll: builder.mutation({ query: (body) => ({ url: "/ground-floor/enroll", method: "POST", body }), invalidatesTags: ["Auth","Bill"] }),
    updateMyProfile: builder.mutation({ query: (body) => ({ url: "/users/me", method: "PATCH", body }), invalidatesTags: ["Auth"] }),
    listSettings: builder.query({ query: () => "/settings", providesTags: ["Setting"] }),
    upsertSetting: builder.mutation({ query: ({ key, ...body }) => ({ url: "/settings/" + key, method: "PUT", body }), invalidatesTags: ["Setting","Menu","MenuList","Bill","Auth"] }),
    listInventory: builder.query({ query: (params) => ({ url: "/inventory", params }), providesTags: ["Inventory"] }),
    createInventory: builder.mutation({ query: (body) => ({ url: "/inventory", method: "POST", body }), invalidatesTags: ["Inventory"] }),
    recordStock: builder.mutation({ query: ({ id, ...body }) => ({ url: "/inventory/" + id + "/stock", method: "POST", body }), invalidatesTags: ["Inventory"] }),
    myInventoryRequests: builder.query({ query: () => "/inventory-requests/my", providesTags: ["InventoryRequest"] }),
    allInventoryRequests: builder.query({ query: (params) => ({ url: "/inventory-requests", params }), providesTags: ["InventoryRequest"] }),
    createInventoryRequest: builder.mutation({ query: (body) => ({ url: "/inventory-requests", method: "POST", body }), invalidatesTags: ["InventoryRequest"] }),
    decideInventoryRequest: builder.mutation({ query: ({ id, ...body }) => ({ url: "/inventory-requests/" + id + "/decide", method: "PATCH", body }), invalidatesTags: ["InventoryRequest","Inventory"] })
  })
});

export const {
  useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation,
  useTodayMenuQuery, useUpcomingMenusQuery, useListMenusQuery, useMenuDetailQuery,
  useCreateMenuMutation, useUpdateMenuMutation, useDeleteMenuMutation,
  useRegisterMealMutation, useCancelRegistrationMutation, useMyRegistrationsQuery, useSessionRegistrationsQuery,
  useGenerateQrMutation, useVerifyQrMutation, useManualCheckInMutation, useMyAttendanceQuery,
  useRunningBillQuery, useListSettingsQuery, useUpsertSettingMutation, useGroundFloorInfoQuery, useGroundFloorEnrollMutation, useUpdateMyProfileMutation, useBillingDebugQuery, useResetPaymentsMutation, useMyBillsQuery,
  usePayDirectMutation, useInitiatePaymentMutation, useMyPaymentsQuery, useAllPaymentsQuery,
  useMyComplaintsQuery, useCreateComplaintMutation, useAllComplaintsQuery, useUpdateComplaintStatusMutation,
  useCreateRefundMutation, useMyRefundsQuery, useAllRefundsQuery,
  useMyLeavesQuery, useCreateLeaveMutation, useAllLeavesQuery, useDecideLeaveMutation, useCancelRequestMutation,
  useListUsersQuery, useSetUserStatusMutation,
  useListAnnouncementsQuery, useCreateAnnouncementMutation,
  useMyNotificationsQuery,
  useSubmitFeedbackMutation, useMyFeedbackQuery, useAllFeedbackQuery, useFeedbackStatsQuery,
  useListWastageQuery, useMyWastageQuery, useCreateWastageMutation, useWastageStatsQuery,
  useListInventoryQuery, useCreateInventoryMutation, useRecordStockMutation,
  useMyInventoryRequestsQuery, useAllInventoryRequestsQuery,
  useCreateInventoryRequestMutation, useDecideInventoryRequestMutation
} = api;