export type LeadAppointmentRow = {
    id: string | number;
    Full_name: string | null;
    First_Name: string | null;
    Last_Name: string | null;
    requirements: string | null;
    appointment_time: string | null;
    phone: string | null;
    email: string | null;
    lead_score: string | number | null;
};

export type ViewMode = 'day' | 'week' | 'month';
