import apiClient from './apiClient';
import { AxiosResponse } from 'axios';

// Types
export interface Physiotherapist {
  id: string;
  userId: string;
  clinicId: string;
  licenseNumber?: string;
  specialization?: string;
  bio?: string;
  yearsOfExperience?: number;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

export interface Activity {
  id: string;
  clinicId: string;
  physiotherapistId: string;
  name: string;
  description?: string;
  type: string;
  difficulty: string;
  maxParticipants: number;
  durationMinutes: number;
  price?: number;
  imageUrl?: string;
  isActive: boolean;
  schedules?: ActivitySchedule[];
  physiotherapist?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface ActivitySchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  physiotherapistId: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  notes?: string;
  diagnosisNotes?: string;
  treatmentNotes?: string;
  patient?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  physiotherapist?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface ActivityBooking {
  id: string;
  activityId: string;
  patientId: string;
  sessionDate: string;
  status: string;
  notes?: string;
  activity?: Activity;
}

export interface Patient {
  id: string;
  userId: string;
  clinicId: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  clinic?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

export interface CalendarBlock {
  startTime: string;
  endTime: string;
  type: 'appointment' | 'activity' | 'available' | 'unavailable';
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  patientName?: string;
  participantsCount?: number;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: string;
  isWorkingDay: boolean;
  workingHours?: {
    start: string;
    end: string;
  };
  blocks: CalendarBlock[];
  summary: {
    totalAppointments: number;
    totalActivities: number;
    busyTime?: string;
  };
}

// Physiotherapists Service
export const physiotherapistsService = {
  getAll: (isActive?: boolean): Promise<AxiosResponse<Physiotherapist[]>> => {
    const params = isActive !== undefined ? { isActive } : {};
    return apiClient.get('/physiotherapists', { params });
  },

  getById: (id: string): Promise<AxiosResponse<Physiotherapist>> => {
    return apiClient.get(`/physiotherapists/${id}`);
  },

  getAvailabilities: (id: string): Promise<AxiosResponse<any[]>> => {
    return apiClient.get(`/physiotherapists/${id}/availabilities`);
  },

  getActivities: (id: string): Promise<AxiosResponse<any[]>> => {
    return apiClient.get(`/physiotherapists/${id}/activities`);
  },

  update: (id: string, data: any): Promise<AxiosResponse<Physiotherapist>> => {
    return apiClient.patch(`/physiotherapists/${id}`, data);
  },
};

// Activities Service
export const activitiesService = {
  getAll: (type?: string, isActive?: boolean): Promise<AxiosResponse<Activity[]>> => {
    const params: any = {};
    if (type) params.type = type;
    if (isActive !== undefined) params.isActive = isActive;
    return apiClient.get('/activities', { params });
  },

  getAvailable: (): Promise<AxiosResponse<Activity[]>> => {
    return apiClient.get('/activities/available');
  },

  getById: (id: string): Promise<AxiosResponse<Activity>> => {
    return apiClient.get(`/activities/${id}`);
  },

  getSchedules: (id: string): Promise<AxiosResponse<ActivitySchedule[]>> => {
    return apiClient.get(`/activities/${id}/schedules`);
  },

  getBookings: (id: string, sessionDate?: string): Promise<AxiosResponse<ActivityBooking[]>> => {
    const params = sessionDate ? { sessionDate } : {};
    return apiClient.get(`/activities/${id}/bookings`, { params });
  },

  countParticipants: (id: string, sessionDate: string): Promise<AxiosResponse<any>> => {
    return apiClient.get(`/activities/${id}/participants-count`, { params: { sessionDate } });
  },

  bookActivity: (id: string, data: { sessionDate: string; notes?: string }): Promise<AxiosResponse<ActivityBooking>> => {
    return apiClient.post(`/activities/${id}/book`, data);
  },

  cancelBooking: (activityId: string, bookingId: string, cancellationReason?: string): Promise<AxiosResponse<ActivityBooking>> => {
    return apiClient.post(`/activities/${activityId}/bookings/${bookingId}/cancel`, { cancellationReason });
  },

  create: (data: any): Promise<AxiosResponse<Activity>> => {
    return apiClient.post('/activities', data);
  },

  update: (id: string, data: any): Promise<AxiosResponse<Activity>> => {
    return apiClient.patch(`/activities/${id}`, data);
  },

  addSchedule: (id: string, schedule: any): Promise<AxiosResponse<ActivitySchedule>> => {
    return apiClient.post(`/activities/${id}/schedules`, schedule);
  },

  removeSchedule: (activityId: string, scheduleId: string): Promise<AxiosResponse<void>> => {
    return apiClient.delete(`/activities/${activityId}/schedules/${scheduleId}`);
  },

  deactivate: (id: string): Promise<AxiosResponse<void>> => {
    return apiClient.delete(`/activities/${id}`);
  },
};

// Appointments Service
export const appointmentsService = {
  getAll: (filters?: {
    physiotherapistId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse<Appointment[]>> => {
    return apiClient.get('/appointments', { params: filters });
  },

  getMyAppointments: (status?: string): Promise<AxiosResponse<Appointment[]>> => {
    const params = status ? { status } : {};
    return apiClient.get('/appointments/my-appointments', { params });
  },

  getById: (id: string): Promise<AxiosResponse<Appointment>> => {
    return apiClient.get(`/appointments/${id}`);
  },

  checkAvailability: (physiotherapistId: string, date: string): Promise<AxiosResponse<any>> => {
    return apiClient.get(`/appointments/availability/${physiotherapistId}`, { params: { date } });
  },

  create: (data: {
    patientId: string;
    physiotherapistId: string;
    startTime: string;
    endTime: string;
    reason?: string;
    notes?: string;
  }): Promise<AxiosResponse<Appointment>> => {
    return apiClient.post('/appointments', data);
  },

  update: (id: string, data: any): Promise<AxiosResponse<Appointment>> => {
    return apiClient.patch(`/appointments/${id}`, data);
  },

  confirm: (id: string): Promise<AxiosResponse<Appointment>> => {
    return apiClient.post(`/appointments/${id}/confirm`);
  },

  complete: (id: string): Promise<AxiosResponse<Appointment>> => {
    return apiClient.post(`/appointments/${id}/complete`);
  },

  cancel: (id: string, cancellationReason?: string): Promise<AxiosResponse<Appointment>> => {
    return apiClient.post(`/appointments/${id}/cancel`, { cancellationReason });
  },

  delete: (id: string): Promise<AxiosResponse<void>> => {
    return apiClient.delete(`/appointments/${id}`);
  },
};

// Patients Service
export const patientsService = {
  getAll: (isActive?: boolean, search?: string): Promise<AxiosResponse<Patient[]>> => {
    const params: any = {};
    if (isActive !== undefined) params.isActive = isActive;
    if (search) params.search = search;
    return apiClient.get('/patients', { params });
  },

  getMyProfile: (): Promise<AxiosResponse<Patient>> => {
    return apiClient.get('/patients/me');
  },

  getById: (id: string): Promise<AxiosResponse<Patient>> => {
    return apiClient.get(`/patients/${id}`);
  },

  getAppointments: (id: string): Promise<AxiosResponse<Appointment[]>> => {
    return apiClient.get(`/patients/${id}/appointments`);
  },

  getActivityBookings: (id: string): Promise<AxiosResponse<ActivityBooking[]>> => {
    return apiClient.get(`/patients/${id}/activity-bookings`);
  },

  updateMyProfile: (data: any): Promise<AxiosResponse<Patient>> => {
    return apiClient.patch('/patients/me', data);
  },

  update: (id: string, data: any): Promise<AxiosResponse<Patient>> => {
    return apiClient.patch(`/patients/${id}`, data);
  },

  deactivate: (id: string): Promise<AxiosResponse<void>> => {
    return apiClient.delete(`/patients/${id}`);
  },
};

// Calendar Service
export const calendarService = {
  getPhysiotherapistDaySchedule: (physiotherapistId: string, date: string): Promise<AxiosResponse<DaySchedule>> => {
    return apiClient.get(`/calendar/physiotherapist/${physiotherapistId}/day`, { params: { date } });
  },

  getPhysiotherapistWeekSchedule: (physiotherapistId: string, startDate: string): Promise<AxiosResponse<any>> => {
    return apiClient.get(`/calendar/physiotherapist/${physiotherapistId}/week`, { params: { startDate } });
  },

  getMySchedule: (date?: string, view: 'day' | 'week' = 'day'): Promise<AxiosResponse<DaySchedule | any>> => {
    const params: any = { view };
    if (date) params.date = date;
    return apiClient.get('/calendar/my-schedule', { params });
  },

  getClinicOverview: (date: string): Promise<AxiosResponse<any>> => {
    return apiClient.get('/calendar/clinic/overview', { params: { date } });
  },

  getAvailableSlots: (physiotherapistId: string, date: string, duration: number = 60): Promise<AxiosResponse<any>> => {
    return apiClient.get(`/calendar/available-slots/${physiotherapistId}`, { params: { date, duration } });
  },
};

// Clinic Requests Service
export const clinicRequestsService = {
  create: (clinicId: string, message?: string): Promise<AxiosResponse<any>> => {
    return apiClient.post('/clinic-requests', { clinicId, message });
  },

  getPending: (): Promise<AxiosResponse<any[]>> => {
    return apiClient.get('/clinic-requests/pending');
  },

  getMyRequests: (): Promise<AxiosResponse<any[]>> => {
    return apiClient.get('/clinic-requests/my-requests');
  },

  respond: (id: string, status: 'APPROVED' | 'REJECTED', responseMessage?: string): Promise<AxiosResponse<any>> => {
    return apiClient.patch(`/clinic-requests/${id}/respond`, { status, responseMessage });
  },
};

// Clinics Service
export const clinicsService = {
  getAll: (): Promise<AxiosResponse<any[]>> => {
    return apiClient.get('/clinics');
  },

  getById: (id: string): Promise<AxiosResponse<any>> => {
    return apiClient.get(`/clinics/${id}`);
  },
};
