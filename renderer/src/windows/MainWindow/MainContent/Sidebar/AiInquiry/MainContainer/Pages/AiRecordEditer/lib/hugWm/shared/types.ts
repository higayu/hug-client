export type HugFacility = {
  facility_id: number;
  name: string;
  selected?: boolean;
};

export type HugChild = { child_id: number; name: string };

export type HugPersonalRecord = {
  date: string;
  childName: string;
  attendance: string;
  note: string;
  user_id: number | null;
  staffName: string;
};
