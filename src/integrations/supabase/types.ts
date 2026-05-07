export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      backup_requests: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          activity_log_id: string | null
          admin_note: string | null
          created_at: string
          current_address: string | null
          current_lat: number | null
          current_lng: number | null
          description: string
          dispatched_helper: string | null
          estimated_delay_minutes: number | null
          id: string
          kind: Database["public"]["Enums"]["backup_request_kind"]
          requested_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["backup_request_status"]
          synced_to_admin: boolean
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["backup_urgency"]
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          activity_log_id?: string | null
          admin_note?: string | null
          created_at?: string
          current_address?: string | null
          current_lat?: number | null
          current_lng?: number | null
          description?: string
          dispatched_helper?: string | null
          estimated_delay_minutes?: number | null
          id?: string
          kind: Database["public"]["Enums"]["backup_request_kind"]
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["backup_request_status"]
          synced_to_admin?: boolean
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["backup_urgency"]
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          activity_log_id?: string | null
          admin_note?: string | null
          created_at?: string
          current_address?: string | null
          current_lat?: number | null
          current_lng?: number | null
          description?: string
          dispatched_helper?: string | null
          estimated_delay_minutes?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["backup_request_kind"]
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["backup_request_status"]
          synced_to_admin?: boolean
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["backup_urgency"]
          user_id?: string
        }
        Relationships: []
      }
      bin_fill_predictions: {
        Row: {
          avg_kg_per_day: number | null
          computed_at: string
          confidence: number | null
          container_type: string
          created_at: string
          customer_ref: string
          id: string
          last_visit_date: string | null
          predicted_fill_percent: number
          predicted_full_date: string | null
          reasoning: string | null
        }
        Insert: {
          avg_kg_per_day?: number | null
          computed_at?: string
          confidence?: number | null
          container_type?: string
          created_at?: string
          customer_ref: string
          id?: string
          last_visit_date?: string | null
          predicted_fill_percent?: number
          predicted_full_date?: string | null
          reasoning?: string | null
        }
        Update: {
          avg_kg_per_day?: number | null
          computed_at?: string
          confidence?: number | null
          container_type?: string
          created_at?: string
          customer_ref?: string
          id?: string
          last_visit_date?: string | null
          predicted_fill_percent?: number
          predicted_full_date?: string | null
          reasoning?: string | null
        }
        Relationships: []
      }
      bin_upsell_offers: {
        Row: {
          created_at: string
          customer_name: string
          customer_ref: string
          decided_at: string | null
          driver_note: string | null
          estimated_extra_kg_month: number | null
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["upsell_status"]
          suggested_by: string | null
          updated_at: string
          upsell_type: Database["public"]["Enums"]["upsell_type"]
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_ref: string
          decided_at?: string | null
          driver_note?: string | null
          estimated_extra_kg_month?: number | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["upsell_status"]
          suggested_by?: string | null
          updated_at?: string
          upsell_type: Database["public"]["Enums"]["upsell_type"]
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_ref?: string
          decided_at?: string | null
          driver_note?: string | null
          estimated_extra_kg_month?: number | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["upsell_status"]
          suggested_by?: string | null
          updated_at?: string
          upsell_type?: Database["public"]["Enums"]["upsell_type"]
        }
        Relationships: []
      }
      break_movement_alerts: {
        Row: {
          acknowledged: boolean
          activity_log_id: string | null
          break_start_at: string
          break_start_lat: number
          break_start_lng: number
          created_at: string
          detected_at: string
          detected_lat: number
          detected_lng: number
          distance_m: number
          driver_reason: string | null
          id: string
          synced_to_admin: boolean
          user_id: string
          window_seconds: number
        }
        Insert: {
          acknowledged?: boolean
          activity_log_id?: string | null
          break_start_at: string
          break_start_lat: number
          break_start_lng: number
          created_at?: string
          detected_at?: string
          detected_lat: number
          detected_lng: number
          distance_m: number
          driver_reason?: string | null
          id?: string
          synced_to_admin?: boolean
          user_id: string
          window_seconds: number
        }
        Update: {
          acknowledged?: boolean
          activity_log_id?: string | null
          break_start_at?: string
          break_start_lat?: number
          break_start_lng?: number
          created_at?: string
          detected_at?: string
          detected_lat?: number
          detected_lng?: number
          distance_m?: number
          driver_reason?: string | null
          id?: string
          synced_to_admin?: boolean
          user_id?: string
          window_seconds?: number
        }
        Relationships: []
      }
      customer_quality_scores: {
        Row: {
          access_score: number | null
          created_at: string
          customer_name: string
          customer_ref: string
          id: string
          last_updated: string
          oil_quality_score: number | null
          on_time_score: number | null
          overall_score: number
          payment_score: number | null
          total_oil_kg: number | null
          total_visits: number | null
        }
        Insert: {
          access_score?: number | null
          created_at?: string
          customer_name: string
          customer_ref: string
          id?: string
          last_updated?: string
          oil_quality_score?: number | null
          on_time_score?: number | null
          overall_score?: number
          payment_score?: number | null
          total_oil_kg?: number | null
          total_visits?: number | null
        }
        Update: {
          access_score?: number | null
          created_at?: string
          customer_name?: string
          customer_ref?: string
          id?: string
          last_updated?: string
          oil_quality_score?: number | null
          on_time_score?: number | null
          overall_score?: number
          payment_score?: number | null
          total_oil_kg?: number | null
          total_visits?: number | null
        }
        Relationships: []
      }
      damage_reports: {
        Row: {
          activity_log_id: string | null
          admin_note: string | null
          cause: Database["public"]["Enums"]["damage_cause"]
          created_at: string
          customer_name: string | null
          description: string
          estimated_value_eur: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          item_label: string
          item_type: Database["public"]["Enums"]["damage_item_type"]
          occurred_at: string
          photo_urls: string[] | null
          quantity: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["damage_status"]
          synced_to_admin: boolean
          updated_at: string
          user_id: string
          visit_ref: string | null
          voice_note_url: string | null
        }
        Insert: {
          activity_log_id?: string | null
          admin_note?: string | null
          cause?: Database["public"]["Enums"]["damage_cause"]
          created_at?: string
          customer_name?: string | null
          description?: string
          estimated_value_eur?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          item_label?: string
          item_type: Database["public"]["Enums"]["damage_item_type"]
          occurred_at?: string
          photo_urls?: string[] | null
          quantity?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["damage_status"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id: string
          visit_ref?: string | null
          voice_note_url?: string | null
        }
        Update: {
          activity_log_id?: string | null
          admin_note?: string | null
          cause?: Database["public"]["Enums"]["damage_cause"]
          created_at?: string
          customer_name?: string | null
          description?: string
          estimated_value_eur?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          item_label?: string
          item_type?: Database["public"]["Enums"]["damage_item_type"]
          occurred_at?: string
          photo_urls?: string[] | null
          quantity?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["damage_status"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id?: string
          visit_ref?: string | null
          voice_note_url?: string | null
        }
        Relationships: []
      }
      day_locks: {
        Row: {
          created_at: string
          driver_user_id: string
          id: string
          locked: boolean
          locked_at: string
          locked_by: string | null
          log_date: string
          reason: string | null
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_user_id: string
          id?: string
          locked?: boolean
          locked_at?: string
          locked_by?: string | null
          log_date: string
          reason?: string | null
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_user_id?: string
          id?: string
          locked?: boolean
          locked_at?: string
          locked_by?: string | null
          log_date?: string
          reason?: string | null
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_signatures: {
        Row: {
          activity_log_id: string | null
          created_at: string
          customer_name: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          items_summary: Json
          notes: string | null
          purpose: Database["public"]["Enums"]["signature_purpose"]
          signature_data: string
          signed_at: string
          signer_name: string
          signer_role: string | null
          synced_to_admin: boolean
          total_amount_eur: number | null
          updated_at: string
          user_id: string
          visit_ref: string | null
        }
        Insert: {
          activity_log_id?: string | null
          created_at?: string
          customer_name: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          items_summary?: Json
          notes?: string | null
          purpose?: Database["public"]["Enums"]["signature_purpose"]
          signature_data: string
          signed_at?: string
          signer_name: string
          signer_role?: string | null
          synced_to_admin?: boolean
          total_amount_eur?: number | null
          updated_at?: string
          user_id: string
          visit_ref?: string | null
        }
        Update: {
          activity_log_id?: string | null
          created_at?: string
          customer_name?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          items_summary?: Json
          notes?: string | null
          purpose?: Database["public"]["Enums"]["signature_purpose"]
          signature_data?: string
          signed_at?: string
          signer_name?: string
          signer_role?: string | null
          synced_to_admin?: boolean
          total_amount_eur?: number | null
          updated_at?: string
          user_id?: string
          visit_ref?: string | null
        }
        Relationships: []
      }
      depots: {
        Row: {
          address: string | null
          created_at: string
          geofence_radius_m: number
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dispatched_visits: {
        Row: {
          address: string
          contact_phone: string | null
          contract_price: number | null
          created_at: string
          customer_name: string
          dispatched_by: string | null
          driver_user_id: string
          estimated_oil_kg: number | null
          external_ref: string | null
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          priority: Database["public"]["Enums"]["dispatched_visit_priority"]
          rejection_reason: string | null
          responded_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["dispatched_visit_status"]
          updated_at: string
        }
        Insert: {
          address: string
          contact_phone?: string | null
          contract_price?: number | null
          created_at?: string
          customer_name: string
          dispatched_by?: string | null
          driver_user_id: string
          estimated_oil_kg?: number | null
          external_ref?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["dispatched_visit_priority"]
          rejection_reason?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["dispatched_visit_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          contact_phone?: string | null
          contract_price?: number | null
          created_at?: string
          customer_name?: string
          dispatched_by?: string | null
          driver_user_id?: string
          estimated_oil_kg?: number | null
          external_ref?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["dispatched_visit_priority"]
          rejection_reason?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["dispatched_visit_status"]
          updated_at?: string
        }
        Relationships: []
      }
      driver_activity_logs: {
        Row: {
          break_minutes: number | null
          created_at: string
          daily_hash: string | null
          depot_id: string | null
          drive_minutes: number | null
          driven_km: number | null
          edit_count: number
          end_km: number | null
          end_lat: number | null
          end_lng: number | null
          id: string
          log_date: string
          notes: string | null
          override_reason: string | null
          start_address: string | null
          start_km: number | null
          start_lat: number | null
          start_lng: number | null
          start_location_type: string | null
          status: Database["public"]["Enums"]["day_status"]
          total_work_minutes: number | null
          updated_at: string
          user_id: string
          vehicle_preloaded_for_next_day: boolean
          warehouse_minutes: number | null
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string
          daily_hash?: string | null
          depot_id?: string | null
          drive_minutes?: number | null
          driven_km?: number | null
          edit_count?: number
          end_km?: number | null
          end_lat?: number | null
          end_lng?: number | null
          id?: string
          log_date: string
          notes?: string | null
          override_reason?: string | null
          start_address?: string | null
          start_km?: number | null
          start_lat?: number | null
          start_lng?: number | null
          start_location_type?: string | null
          status?: Database["public"]["Enums"]["day_status"]
          total_work_minutes?: number | null
          updated_at?: string
          user_id: string
          vehicle_preloaded_for_next_day?: boolean
          warehouse_minutes?: number | null
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          break_minutes?: number | null
          created_at?: string
          daily_hash?: string | null
          depot_id?: string | null
          drive_minutes?: number | null
          driven_km?: number | null
          edit_count?: number
          end_km?: number | null
          end_lat?: number | null
          end_lng?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          override_reason?: string | null
          start_address?: string | null
          start_km?: number | null
          start_lat?: number | null
          start_lng?: number | null
          start_location_type?: string | null
          status?: Database["public"]["Enums"]["day_status"]
          total_work_minutes?: number | null
          updated_at?: string
          user_id?: string
          vehicle_preloaded_for_next_day?: boolean
          warehouse_minutes?: number | null
          work_end?: string | null
          work_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_activity_logs_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_audit_logs: {
        Row: {
          activity_log_id: string | null
          change_reason: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          activity_log_id?: string | null
          change_reason?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          activity_log_id?: string | null
          change_reason?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_audit_logs_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "driver_activity_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_live_locations: {
        Row: {
          accuracy_m: number | null
          activity_log_id: string | null
          battery_percent: number | null
          captured_at: string
          created_at: string
          heading: number | null
          id: string
          is_moving: boolean
          lat: number
          lng: number
          speed_kmh: number | null
          synced_to_admin: boolean
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          activity_log_id?: string | null
          battery_percent?: number | null
          captured_at?: string
          created_at?: string
          heading?: number | null
          id?: string
          is_moving?: boolean
          lat: number
          lng: number
          speed_kmh?: number | null
          synced_to_admin?: boolean
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          activity_log_id?: string | null
          battery_percent?: number | null
          captured_at?: string
          created_at?: string
          heading?: number | null
          id?: string
          is_moving?: boolean
          lat?: number
          lng?: number
          speed_kmh?: number | null
          synced_to_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      driver_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          payload: Json | null
          read: boolean
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          payload?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          payload?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_route_stops: {
        Row: {
          activity_log_id: string | null
          actual_duration_minutes: number | null
          address: string
          admin_notes: string | null
          arrived_at: string | null
          bank_update_required: boolean
          collected_oil_kg: number | null
          completed_at: string | null
          contact_person: string | null
          contact_phone: string | null
          containers_dropped: Json
          containers_expected: Json
          containers_picked: Json
          contract_price: number | null
          created_at: string
          customer_name: string
          customer_notes: string | null
          customer_ref: string | null
          customer_tier: string | null
          departed_at: string | null
          dispatched_visit_id: string | null
          driver_notes: string | null
          driver_user_id: string
          estimated_distance_km: number | null
          estimated_oil_kg: number
          external_ref: string | null
          id: string
          lat: number | null
          lng: number | null
          metadata: Json
          minimum_oil_kg: number | null
          planned_arrival_at: string | null
          planned_departure_at: string | null
          planned_duration_minutes: number | null
          priority: Database["public"]["Enums"]["dispatched_visit_priority"]
          products_delivered: Json
          products_expected: Json
          proof_of_collection_id: string | null
          route_id: string
          scheduled_time: string | null
          service_started_at: string | null
          skip_reason: string | null
          skipped_at: string | null
          status: Database["public"]["Enums"]["driver_route_stop_status"]
          stop_order: number
          stop_type: Database["public"]["Enums"]["stop_type"]
          synced_to_admin: boolean
          updated_at: string
          visit_source: Database["public"]["Enums"]["driver_route_visit_source"]
        }
        Insert: {
          activity_log_id?: string | null
          actual_duration_minutes?: number | null
          address: string
          admin_notes?: string | null
          arrived_at?: string | null
          bank_update_required?: boolean
          collected_oil_kg?: number | null
          completed_at?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          containers_dropped?: Json
          containers_expected?: Json
          containers_picked?: Json
          contract_price?: number | null
          created_at?: string
          customer_name: string
          customer_notes?: string | null
          customer_ref?: string | null
          customer_tier?: string | null
          departed_at?: string | null
          dispatched_visit_id?: string | null
          driver_notes?: string | null
          driver_user_id: string
          estimated_distance_km?: number | null
          estimated_oil_kg?: number
          external_ref?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json
          minimum_oil_kg?: number | null
          planned_arrival_at?: string | null
          planned_departure_at?: string | null
          planned_duration_minutes?: number | null
          priority?: Database["public"]["Enums"]["dispatched_visit_priority"]
          products_delivered?: Json
          products_expected?: Json
          proof_of_collection_id?: string | null
          route_id: string
          scheduled_time?: string | null
          service_started_at?: string | null
          skip_reason?: string | null
          skipped_at?: string | null
          status?: Database["public"]["Enums"]["driver_route_stop_status"]
          stop_order: number
          stop_type?: Database["public"]["Enums"]["stop_type"]
          synced_to_admin?: boolean
          updated_at?: string
          visit_source?: Database["public"]["Enums"]["driver_route_visit_source"]
        }
        Update: {
          activity_log_id?: string | null
          actual_duration_minutes?: number | null
          address?: string
          admin_notes?: string | null
          arrived_at?: string | null
          bank_update_required?: boolean
          collected_oil_kg?: number | null
          completed_at?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          containers_dropped?: Json
          containers_expected?: Json
          containers_picked?: Json
          contract_price?: number | null
          created_at?: string
          customer_name?: string
          customer_notes?: string | null
          customer_ref?: string | null
          customer_tier?: string | null
          departed_at?: string | null
          dispatched_visit_id?: string | null
          driver_notes?: string | null
          driver_user_id?: string
          estimated_distance_km?: number | null
          estimated_oil_kg?: number
          external_ref?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json
          minimum_oil_kg?: number | null
          planned_arrival_at?: string | null
          planned_departure_at?: string | null
          planned_duration_minutes?: number | null
          priority?: Database["public"]["Enums"]["dispatched_visit_priority"]
          products_delivered?: Json
          products_expected?: Json
          proof_of_collection_id?: string | null
          route_id?: string
          scheduled_time?: string | null
          service_started_at?: string | null
          skip_reason?: string | null
          skipped_at?: string | null
          status?: Database["public"]["Enums"]["driver_route_stop_status"]
          stop_order?: number
          stop_type?: Database["public"]["Enums"]["stop_type"]
          synced_to_admin?: boolean
          updated_at?: string
          visit_source?: Database["public"]["Enums"]["driver_route_visit_source"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_route_stops_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "driver_activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_route_stops_dispatched_visit_id_fkey"
            columns: ["dispatched_visit_id"]
            isOneToOne: false
            referencedRelation: "dispatched_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_route_stops_driver_user_id_fkey"
            columns: ["driver_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_route_stops_proof_of_collection_id_fkey"
            columns: ["proof_of_collection_id"]
            isOneToOne: false
            referencedRelation: "proof_of_collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "driver_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_routes: {
        Row: {
          actual_end_at: string | null
          actual_start_at: string | null
          actual_total_km: number | null
          admin_notes: string | null
          collected_total_oil_kg: number
          created_at: string
          depot_id: string | null
          dispatcher_user_id: string | null
          driver_user_id: string
          end_address: string | null
          end_lat: number | null
          end_lng: number | null
          estimated_total_km: number | null
          estimated_total_oil_kg: number
          id: string
          locked_at: string | null
          notes: string | null
          planned_end_at: string | null
          planned_start_at: string | null
          route_code: string
          route_date: string
          start_address: string | null
          start_lat: number | null
          start_lng: number | null
          status: Database["public"]["Enums"]["driver_route_status"]
          synced_to_admin: boolean
          total_completed_stops: number
          total_planned_stops: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          actual_total_km?: number | null
          admin_notes?: string | null
          collected_total_oil_kg?: number
          created_at?: string
          depot_id?: string | null
          dispatcher_user_id?: string | null
          driver_user_id: string
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          estimated_total_km?: number | null
          estimated_total_oil_kg?: number
          id?: string
          locked_at?: string | null
          notes?: string | null
          planned_end_at?: string | null
          planned_start_at?: string | null
          route_code: string
          route_date: string
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          status?: Database["public"]["Enums"]["driver_route_status"]
          synced_to_admin?: boolean
          total_completed_stops?: number
          total_planned_stops?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          actual_total_km?: number | null
          admin_notes?: string | null
          collected_total_oil_kg?: number
          created_at?: string
          depot_id?: string | null
          dispatcher_user_id?: string | null
          driver_user_id?: string
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          estimated_total_km?: number | null
          estimated_total_oil_kg?: number
          id?: string
          locked_at?: string | null
          notes?: string | null
          planned_end_at?: string | null
          planned_start_at?: string | null
          route_code?: string
          route_date?: string
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          status?: Database["public"]["Enums"]["driver_route_status"]
          synced_to_admin?: boolean
          total_completed_stops?: number
          total_planned_stops?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_routes_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_routes_dispatcher_user_id_fkey"
            columns: ["dispatcher_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_routes_driver_user_id_fkey"
            columns: ["driver_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_performance: {
        Row: {
          badges: Json
          best_streak_days: number
          created_at: string
          current_streak_days: number
          id: string
          last_visit_date: string | null
          level: number
          on_time_visits: number
          total_oil_kg: number
          total_points: number
          total_visits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json
          best_streak_days?: number
          created_at?: string
          current_streak_days?: number
          id?: string
          last_visit_date?: string | null
          level?: number
          on_time_visits?: number
          total_oil_kg?: number
          total_points?: number
          total_visits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json
          best_streak_days?: number
          created_at?: string
          current_streak_days?: number
          id?: string
          last_visit_date?: string | null
          level?: number
          on_time_visits?: number
          total_oil_kg?: number
          total_points?: number
          total_visits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_visit_logs: {
        Row: {
          activity_log_id: string
          arrival_time: string | null
          created_at: string
          customer_name: string
          departure_time: string | null
          id: string
          notes: string | null
          operation_type: Database["public"]["Enums"]["operation_type"]
          stop_type: Database["public"]["Enums"]["stop_type"]
          user_id: string
        }
        Insert: {
          activity_log_id: string
          arrival_time?: string | null
          created_at?: string
          customer_name: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"]
          stop_type?: Database["public"]["Enums"]["stop_type"]
          user_id: string
        }
        Update: {
          activity_log_id?: string
          arrival_time?: string | null
          created_at?: string
          customer_name?: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          operation_type?: Database["public"]["Enums"]["operation_type"]
          stop_type?: Database["public"]["Enums"]["stop_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_visit_logs_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "driver_activity_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      fatigue_events: {
        Row: {
          activity_log_id: string | null
          alert_shown_at: string
          break_taken_at: string | null
          continuous_drive_minutes: number
          created_at: string
          dismissed: boolean
          id: string
          synced_to_admin: boolean
          user_id: string
        }
        Insert: {
          activity_log_id?: string | null
          alert_shown_at?: string
          break_taken_at?: string | null
          continuous_drive_minutes: number
          created_at?: string
          dismissed?: boolean
          id?: string
          synced_to_admin?: boolean
          user_id: string
        }
        Update: {
          activity_log_id?: string | null
          alert_shown_at?: string
          break_taken_at?: string | null
          continuous_drive_minutes?: number
          created_at?: string
          dismissed?: boolean
          id?: string
          synced_to_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          activity_log_id: string | null
          admin_acknowledged: boolean
          created_at: string
          description: string
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          injuries: boolean
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          occurred_at: string
          other_party_info: Json | null
          photo_urls: string[] | null
          police_report_number: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          synced_to_admin: boolean
          updated_at: string
          user_id: string
          vehicle_drivable: boolean
          vehicle_id: string | null
          voice_note_url: string | null
        }
        Insert: {
          activity_log_id?: string | null
          admin_acknowledged?: boolean
          created_at?: string
          description: string
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          injuries?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          occurred_at?: string
          other_party_info?: Json | null
          photo_urls?: string[] | null
          police_report_number?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id: string
          vehicle_drivable?: boolean
          vehicle_id?: string | null
          voice_note_url?: string | null
        }
        Update: {
          activity_log_id?: string | null
          admin_acknowledged?: boolean
          created_at?: string
          description?: string
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          injuries?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          occurred_at?: string
          other_party_info?: Json | null
          photo_urls?: string[] | null
          police_report_number?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id?: string
          vehicle_drivable?: boolean
          vehicle_id?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      km_deviation_alerts: {
        Row: {
          admin_note: string | null
          created_at: string
          deviation_km: number
          driver_explanation: string | null
          id: string
          log_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["km_deviation_status"]
          synced_to_admin: boolean
          threshold_km: number
          today_start_km: number | null
          updated_at: string
          user_id: string
          yesterday_end_km: number | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          deviation_km: number
          driver_explanation?: string | null
          id?: string
          log_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["km_deviation_status"]
          synced_to_admin?: boolean
          threshold_km?: number
          today_start_km?: number | null
          updated_at?: string
          user_id: string
          yesterday_end_km?: number | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          deviation_km?: number
          driver_explanation?: string | null
          id?: string
          log_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["km_deviation_status"]
          synced_to_admin?: boolean
          threshold_km?: number
          today_start_km?: number | null
          updated_at?: string
          user_id?: string
          yesterday_end_km?: number | null
        }
        Relationships: []
      }
      misc_expenses: {
        Row: {
          activity_log_id: string | null
          admin_note: string | null
          amount: number
          category: Database["public"]["Enums"]["misc_expense_category"]
          created_at: string
          description: string
          expense_date: string
          has_receipt: boolean
          id: string
          notes: string | null
          payment_method: string | null
          receipt_photo_url: string | null
          reimbursed_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["misc_expense_status"]
          synced_to_admin: boolean
          updated_at: string
          user_id: string
          vat_percent: number | null
          vendor: string | null
        }
        Insert: {
          activity_log_id?: string | null
          admin_note?: string | null
          amount: number
          category?: Database["public"]["Enums"]["misc_expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          has_receipt?: boolean
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_photo_url?: string | null
          reimbursed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["misc_expense_status"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id: string
          vat_percent?: number | null
          vendor?: string | null
        }
        Update: {
          activity_log_id?: string | null
          admin_note?: string | null
          amount?: number
          category?: Database["public"]["Enums"]["misc_expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          has_receipt?: boolean
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_photo_url?: string | null
          reimbursed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["misc_expense_status"]
          synced_to_admin?: boolean
          updated_at?: string
          user_id?: string
          vat_percent?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      post_trip_checklists: {
        Row: {
          activity_log_id: string | null
          adblue_refilled: boolean
          bins_returned: boolean
          cargo_area_clean: boolean
          cash_amount_eur: number | null
          cash_handed_over: boolean
          completed_at: string
          created_at: string
          damage_description: string | null
          damage_noticed: boolean
          end_km: number | null
          fridge_off: boolean
          fuel_gauge_photo_url: string | null
          fuel_level_percent: number | null
          id: string
          keys_handed_over: boolean
          log_date: string
          notes: string | null
          odometer_photo_gps_lat: number | null
          odometer_photo_gps_lng: number | null
          odometer_photo_url: string | null
          paperwork_submitted: boolean
          personal_km_deviation: number | null
          photo_urls: string[] | null
          signature_data: string | null
          synced_to_admin: boolean
          updated_at: string
          user_id: string
          vehicle_id: string | null
          vehicle_locked: boolean
        }
        Insert: {
          activity_log_id?: string | null
          adblue_refilled?: boolean
          bins_returned?: boolean
          cargo_area_clean?: boolean
          cash_amount_eur?: number | null
          cash_handed_over?: boolean
          completed_at?: string
          created_at?: string
          damage_description?: string | null
          damage_noticed?: boolean
          end_km?: number | null
          fridge_off?: boolean
          fuel_gauge_photo_url?: string | null
          fuel_level_percent?: number | null
          id?: string
          keys_handed_over?: boolean
          log_date: string
          notes?: string | null
          odometer_photo_gps_lat?: number | null
          odometer_photo_gps_lng?: number | null
          odometer_photo_url?: string | null
          paperwork_submitted?: boolean
          personal_km_deviation?: number | null
          photo_urls?: string[] | null
          signature_data?: string | null
          synced_to_admin?: boolean
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          vehicle_locked?: boolean
        }
        Update: {
          activity_log_id?: string | null
          adblue_refilled?: boolean
          bins_returned?: boolean
          cargo_area_clean?: boolean
          cash_amount_eur?: number | null
          cash_handed_over?: boolean
          completed_at?: string
          created_at?: string
          damage_description?: string | null
          damage_noticed?: boolean
          end_km?: number | null
          fridge_off?: boolean
          fuel_gauge_photo_url?: string | null
          fuel_level_percent?: number | null
          id?: string
          keys_handed_over?: boolean
          log_date?: string
          notes?: string | null
          odometer_photo_gps_lat?: number | null
          odometer_photo_gps_lng?: number | null
          odometer_photo_url?: string | null
          paperwork_submitted?: boolean
          personal_km_deviation?: number | null
          photo_urls?: string[] | null
          signature_data?: string | null
          synced_to_admin?: boolean
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          vehicle_locked?: boolean
        }
        Relationships: []
      }
      pre_trip_inspections: {
        Row: {
          adblue_ok: boolean
          blocked_from_driving: boolean
          body_damage_ok: boolean
          brakes_ok: boolean
          created_at: string
          defects_noted: string | null
          fire_extinguisher_ok: boolean
          first_aid_kit_ok: boolean
          fuel_gauge_photo_url: string | null
          fuel_level_percent: number | null
          id: string
          lights_ok: boolean
          log_date: string
          odometer_photo_gps_lat: number | null
          odometer_photo_gps_lng: number | null
          odometer_photo_taken_at: string | null
          odometer_photo_url: string | null
          oil_level_ok: boolean
          photo_urls: string[] | null
          reflective_vest_ok: boolean
          signature_data: string | null
          start_km: number | null
          synced_to_admin: boolean
          tires_ok: boolean
          user_id: string
          vehicle_id: string | null
          warning_triangle_ok: boolean
        }
        Insert: {
          adblue_ok?: boolean
          blocked_from_driving?: boolean
          body_damage_ok?: boolean
          brakes_ok?: boolean
          created_at?: string
          defects_noted?: string | null
          fire_extinguisher_ok?: boolean
          first_aid_kit_ok?: boolean
          fuel_gauge_photo_url?: string | null
          fuel_level_percent?: number | null
          id?: string
          lights_ok?: boolean
          log_date: string
          odometer_photo_gps_lat?: number | null
          odometer_photo_gps_lng?: number | null
          odometer_photo_taken_at?: string | null
          odometer_photo_url?: string | null
          oil_level_ok?: boolean
          photo_urls?: string[] | null
          reflective_vest_ok?: boolean
          signature_data?: string | null
          start_km?: number | null
          synced_to_admin?: boolean
          tires_ok?: boolean
          user_id: string
          vehicle_id?: string | null
          warning_triangle_ok?: boolean
        }
        Update: {
          adblue_ok?: boolean
          blocked_from_driving?: boolean
          body_damage_ok?: boolean
          brakes_ok?: boolean
          created_at?: string
          defects_noted?: string | null
          fire_extinguisher_ok?: boolean
          first_aid_kit_ok?: boolean
          fuel_gauge_photo_url?: string | null
          fuel_level_percent?: number | null
          id?: string
          lights_ok?: boolean
          log_date?: string
          odometer_photo_gps_lat?: number | null
          odometer_photo_gps_lng?: number | null
          odometer_photo_taken_at?: string | null
          odometer_photo_url?: string | null
          oil_level_ok?: boolean
          photo_urls?: string[] | null
          reflective_vest_ok?: boolean
          signature_data?: string | null
          start_km?: number | null
          synced_to_admin?: boolean
          tires_ok?: boolean
          user_id?: string
          vehicle_id?: string | null
          warning_triangle_ok?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pre_trip_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          license_plate: string | null
          phone: string | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          license_plate?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          license_plate?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proof_of_collection: {
        Row: {
          activity_log_id: string | null
          collected_at: string
          containers_dropped: Json | null
          containers_picked: Json | null
          created_at: string
          customer_name: string
          gps_accuracy_m: number | null
          gps_lat: number | null
          gps_lng: number | null
          gross_weight_kg: number | null
          id: string
          net_weight_kg: number
          notes: string | null
          photo_urls: string[] | null
          signature_data: string | null
          signer_name: string | null
          synced_to_admin: boolean
          tare_weight_kg: number | null
          updated_at: string
          user_id: string
          visit_ref: string | null
        }
        Insert: {
          activity_log_id?: string | null
          collected_at?: string
          containers_dropped?: Json | null
          containers_picked?: Json | null
          created_at?: string
          customer_name: string
          gps_accuracy_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gross_weight_kg?: number | null
          id?: string
          net_weight_kg?: number
          notes?: string | null
          photo_urls?: string[] | null
          signature_data?: string | null
          signer_name?: string | null
          synced_to_admin?: boolean
          tare_weight_kg?: number | null
          updated_at?: string
          user_id: string
          visit_ref?: string | null
        }
        Update: {
          activity_log_id?: string | null
          collected_at?: string
          containers_dropped?: Json | null
          containers_picked?: Json | null
          created_at?: string
          customer_name?: string
          gps_accuracy_m?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gross_weight_kg?: number | null
          id?: string
          net_weight_kg?: number
          notes?: string | null
          photo_urls?: string[] | null
          signature_data?: string | null
          signer_name?: string | null
          synced_to_admin?: boolean
          tare_weight_kg?: number | null
          updated_at?: string
          user_id?: string
          visit_ref?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      route_optimizations: {
        Row: {
          applied: boolean
          created_at: string
          estimated_fuel_savings_eur: number | null
          estimated_total_km: number | null
          estimated_total_minutes: number | null
          id: string
          input_visits: Json
          log_date: string
          optimized_order: Json
          reasoning: string | null
          user_id: string
        }
        Insert: {
          applied?: boolean
          created_at?: string
          estimated_fuel_savings_eur?: number | null
          estimated_total_km?: number | null
          estimated_total_minutes?: number | null
          id?: string
          input_visits?: Json
          log_date?: string
          optimized_order?: Json
          reasoning?: string | null
          user_id: string
        }
        Update: {
          applied?: boolean
          created_at?: string
          estimated_fuel_savings_eur?: number | null
          estimated_total_km?: number | null
          estimated_total_minutes?: number | null
          id?: string
          input_visits?: Json
          log_date?: string
          optimized_order?: Json
          reasoning?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          last_error: string | null
          max_retries: number
          operation_type: string
          payload: Json
          queued_at: string
          retry_count: number
          status: Database["public"]["Enums"]["sync_status"]
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          operation_type: string
          payload: Json
          queued_at?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["sync_status"]
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          operation_type?: string
          payload?: Json
          queued_at?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["sync_status"]
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_service_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["service_alert_type"]
          created_at: string
          description: string | null
          dismissed_until: string | null
          due_date: string | null
          due_km: number | null
          id: string
          resolved: boolean
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["service_alert_type"]
          created_at?: string
          description?: string | null
          dismissed_until?: string | null
          due_date?: string | null
          due_km?: number | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["service_alert_type"]
          created_at?: string
          description?: string | null
          dismissed_until?: string | null
          due_date?: string | null
          due_km?: number | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_driver_id: string | null
          capacity_kg: number
          created_at: string
          current_km: number
          id: string
          insurance_until: string | null
          is_active: boolean
          license_plate: string
          make: string | null
          model: string | null
          next_oil_change_km: number | null
          next_service_date: string | null
          next_tuv_date: string | null
          notes: string | null
          updated_at: string
          winter_tires_until: string | null
          year: number | null
        }
        Insert: {
          assigned_driver_id?: string | null
          capacity_kg?: number
          created_at?: string
          current_km?: number
          id?: string
          insurance_until?: string | null
          is_active?: boolean
          license_plate: string
          make?: string | null
          model?: string | null
          next_oil_change_km?: number | null
          next_service_date?: string | null
          next_tuv_date?: string | null
          notes?: string | null
          updated_at?: string
          winter_tires_until?: string | null
          year?: number | null
        }
        Update: {
          assigned_driver_id?: string | null
          capacity_kg?: number
          created_at?: string
          current_km?: number
          id?: string
          insurance_until?: string | null
          is_active?: boolean
          license_plate?: string
          make?: string | null
          model?: string | null
          next_oil_change_km?: number | null
          next_service_date?: string | null
          next_tuv_date?: string | null
          notes?: string | null
          updated_at?: string
          winter_tires_until?: string | null
          year?: number | null
        }
        Relationships: []
      }
      work_settings: {
        Row: {
          break_duration_minutes: number
          break_movement_threshold_m: number
          break_movement_window_seconds: number
          created_at: string
          geofence_radius_m: number
          id: string
          max_daily_work_minutes: number
          scope: string
          scope_ref: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          break_duration_minutes?: number
          break_movement_threshold_m?: number
          break_movement_window_seconds?: number
          created_at?: string
          geofence_radius_m?: number
          id?: string
          max_daily_work_minutes?: number
          scope?: string
          scope_ref?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          break_duration_minutes?: number
          break_movement_threshold_m?: number
          break_movement_window_seconds?: number
          created_at?: string
          geofence_radius_m?: number
          id?: string
          max_daily_work_minutes?: number
          scope?: string
          scope_ref?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      backup_request_kind:
        | "extra_driver"
        | "vehicle_swap"
        | "fuel"
        | "tool_equipment"
        | "translator"
        | "medical"
        | "other"
      backup_request_status:
        | "open"
        | "acknowledged"
        | "dispatched"
        | "resolved"
        | "cancelled"
      backup_urgency: "low" | "normal" | "high" | "critical"
      damage_cause:
        | "drop"
        | "collision"
        | "wear"
        | "spoiled"
        | "temperature"
        | "customer_caused"
        | "unknown"
        | "other"
        | "lost"
      damage_item_type:
        | "bin"
        | "barrel_60"
        | "barrel_30"
        | "fresh_food"
        | "product"
        | "other"
      damage_status:
        | "reported"
        | "reviewed"
        | "replaced"
        | "written_off"
        | "rejected"
      day_status: "worked" | "sick" | "vacation" | "rest_day" | "training"
      dispatched_visit_priority: "low" | "normal" | "high" | "urgent"
      dispatched_visit_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      driver_route_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
      driver_route_stop_status:
        | "planned"
        | "en_route"
        | "arrived"
        | "in_progress"
        | "completed"
        | "skipped"
        | "cancelled"
      driver_route_visit_source:
        | "scheduled"
        | "called"
        | "auto_planned"
        | "prospect"
        | "manual"
        | "dispatch_addon"
      incident_type:
        | "accident"
        | "breakdown"
        | "theft"
        | "vandalism"
        | "medical"
        | "fuel_issue"
        | "customer_dispute"
        | "other"
      km_deviation_status: "pending" | "approved" | "flagged" | "resolved"
      misc_expense_category:
        | "cleaning"
        | "tools"
        | "parking"
        | "toll"
        | "carwash"
        | "food"
        | "office"
        | "safety"
        | "other"
      misc_expense_status: "pending" | "approved" | "rejected" | "reimbursed"
      notification_kind:
        | "dispatch"
        | "lock"
        | "unlock"
        | "message"
        | "alert"
        | "system"
        | "incident_ack"
      operation_type: "collection" | "delivery" | "inspection"
      service_alert_type:
        | "tuv"
        | "service"
        | "oil_change"
        | "tires"
        | "insurance"
        | "inspection_defect"
        | "other"
      signature_purpose:
        | "fresh_food_delivery"
        | "oil_collection"
        | "bin_handover"
        | "damage_acknowledgement"
        | "other"
      stop_type:
        | "customer_visit"
        | "warehouse"
        | "home"
        | "break"
        | "suspicious"
        | "transit"
      sync_status: "pending" | "syncing" | "success" | "failed" | "abandoned"
      upsell_status: "suggested" | "accepted" | "declined" | "pending_admin"
      upsell_type:
        | "extra_bin"
        | "larger_container"
        | "extra_pickup"
        | "product_subscription"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["info", "warning", "critical"],
      backup_request_kind: [
        "extra_driver",
        "vehicle_swap",
        "fuel",
        "tool_equipment",
        "translator",
        "medical",
        "other",
      ],
      backup_request_status: [
        "open",
        "acknowledged",
        "dispatched",
        "resolved",
        "cancelled",
      ],
      backup_urgency: ["low", "normal", "high", "critical"],
      damage_cause: [
        "drop",
        "collision",
        "wear",
        "spoiled",
        "temperature",
        "customer_caused",
        "unknown",
        "other",
        "lost",
      ],
      damage_item_type: [
        "bin",
        "barrel_60",
        "barrel_30",
        "fresh_food",
        "product",
        "other",
      ],
      damage_status: [
        "reported",
        "reviewed",
        "replaced",
        "written_off",
        "rejected",
      ],
      day_status: ["worked", "sick", "vacation", "rest_day", "training"],
      dispatched_visit_priority: ["low", "normal", "high", "urgent"],
      dispatched_visit_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      driver_route_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      driver_route_stop_status: [
        "planned",
        "en_route",
        "arrived",
        "in_progress",
        "completed",
        "skipped",
        "cancelled",
      ],
      driver_route_visit_source: [
        "scheduled",
        "called",
        "auto_planned",
        "prospect",
        "manual",
        "dispatch_addon",
      ],
      incident_type: [
        "accident",
        "breakdown",
        "theft",
        "vandalism",
        "medical",
        "fuel_issue",
        "customer_dispute",
        "other",
      ],
      km_deviation_status: ["pending", "approved", "flagged", "resolved"],
      misc_expense_category: [
        "cleaning",
        "tools",
        "parking",
        "toll",
        "carwash",
        "food",
        "office",
        "safety",
        "other",
      ],
      misc_expense_status: ["pending", "approved", "rejected", "reimbursed"],
      notification_kind: [
        "dispatch",
        "lock",
        "unlock",
        "message",
        "alert",
        "system",
        "incident_ack",
      ],
      operation_type: ["collection", "delivery", "inspection"],
      service_alert_type: [
        "tuv",
        "service",
        "oil_change",
        "tires",
        "insurance",
        "inspection_defect",
        "other",
      ],
      signature_purpose: [
        "fresh_food_delivery",
        "oil_collection",
        "bin_handover",
        "damage_acknowledgement",
        "other",
      ],
      stop_type: [
        "customer_visit",
        "warehouse",
        "home",
        "break",
        "suspicious",
        "transit",
      ],
      sync_status: ["pending", "syncing", "success", "failed", "abandoned"],
      upsell_status: ["suggested", "accepted", "declined", "pending_admin"],
      upsell_type: [
        "extra_bin",
        "larger_container",
        "extra_pickup",
        "product_subscription",
      ],
    },
  },
} as const
