# UD Leads Live Usage - Comprehensive Product Requirements Document (PRD)

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core Pages & Features](#core-pages--features)
5. [Database Schema](#database-schema)
6. [Components & UI Elements](#components--ui-elements)
7. [Settings & Configuration](#settings--configuration)
8. [Technical Stack](#technical-stack)
9. [Mobile Responsiveness](#mobile-responsiveness)
10. [Performance Features](#performance-features)
11. [Data Management](#data-management)
12. [Reporting & Analytics](#reporting--analytics)
13. [Implementation Guidelines](#implementation-guidelines)

---

## Executive Summary

**UD Leads Live Usage** is a comprehensive retail lead management and sales tracking system built with React, TypeScript, and Supabase. The system enables sales teams to manage leads, track visits, schedule follow-ups, and analyze performance across territories with role-based access control.

### Key Features:
- **Lead Management**: Complete CRUD operations with photo uploads, location tracking, and status management
- **Visit Recording**: Multi-step visit forms with GPS validation, photo capture, and duration tracking
- **Performance Analytics**: Real-time dashboards with conversion tracking and team performance metrics
- **Territory Management**: Geographic mapping with lead visualization and coverage analysis
- **Follow-up Scheduling**: Automated follow-up management with status tracking
- **Role-based Access**: Admin, Manager, and Salesperson roles with appropriate permissions
- **Mobile-First Design**: Responsive UI optimized for field sales teams
- **Offline Capability**: Draft saving and offline data synchronization

---

## System Architecture

### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 7.1.5
- **UI Library**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query) 5.56.2
- **Routing**: React Router DOM 6.26.2
- **Charts**: Recharts 3.1.2 + Nivo Charts
- **Maps**: React Leaflet 4.2.1
- **Forms**: React Hook Form 7.53.0 + Zod validation

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with PKCE flow
- **Storage**: Supabase Storage for photos and files
- **Real-time**: Supabase Realtime subscriptions
- **API**: Supabase REST API with TypeScript types

### Development Tools
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **Testing**: Vitest + Testing Library
- **Git Hooks**: Husky + lint-staged

---

## Authentication & Authorization

### Authentication System
- **Provider**: Supabase Auth
- **Flow**: PKCE (Proof Key for Code Exchange)
- **Session Management**: Automatic token refresh with localStorage persistence
- **Storage Key**: `retail-lead-compass-auth-main`

### User Roles & Permissions

#### Admin Role
- **Access**: Full system access
- **Capabilities**:
  - View all leads, visits, and users across all territories
  - Manage system settings and configurations
  - Create/edit/delete users and territories
  - Access all analytics and reports
  - Manage conversion rules and status colors
  - Export/import data
  - Configure system branding and themes

#### Manager Role
- **Access**: Team and territory management
- **Capabilities**:
  - View leads and visits for their team members
  - Access team performance analytics
  - Manage team members and assignments
  - View territory coverage for their team
  - Schedule and manage follow-ups for team
  - Export team data

#### Salesperson Role
- **Access**: Personal lead and visit management
- **Capabilities**:
  - View and manage their own leads
  - Record visits with photo uploads
  - Schedule personal follow-ups
  - View personal performance metrics
  - Access territory map for their leads
  - Update personal profile (limited fields)

### Role-Based Data Filtering
- **Leads**: Filtered by `salesperson` field and `manager_id` relationships
- **Visits**: Filtered by `salesperson` field and lead ownership
- **Users**: Filtered by role hierarchy and team assignments
- **Territories**: Access based on user territory assignments

---

## Core Pages & Features

### 1. Dashboard (`/`)
**Purpose**: Central hub for performance overview and quick actions

**Features**:
- **Role-based Content**: Different views for Admin/Manager/Salesperson
- **Date Range Filtering**: All Time, This Week, Today, Last 7 Days, Last 30 Days
- **Salesperson Filtering**: Dropdown to filter by specific salesperson (Admin/Manager only)
- **Performance Metrics**:
  - Total Leads Created
  - Total Visits Completed
  - Conversion Rate
  - Target Achievement
- **Quick Actions**: Add Lead, Record Visit, Schedule Follow-up
- **Recent Activity**: Latest leads and visits
- **Team Performance**: Manager and team member statistics

**Key Components**:
- `DashboardFilters`: Date range and salesperson filtering
- `StatsCard`: Individual metric display with trend indicators
- `SalespersonsSection`: Team performance breakdown
- `TeamPerformanceCard`: Manager and team statistics

### 2. Leads Management (`/leads`)
**Purpose**: Comprehensive lead lifecycle management

**Features**:
- **Multi-view Display**: List view and Grid view
- **Advanced Filtering**:
  - Search by store name, contact person, or notes
  - Filter by status, store type, weekly spend, territory, salesperson
  - Date range filtering
- **Bulk Operations**: Select multiple leads for bulk editing
- **Lead Creation**: Multi-step form with draft saving
- **Lead Editing**: Inline editing with validation
- **Photo Management**: Exterior and interior photo uploads
- **Location Tracking**: GPS coordinates with validation
- **Status Management**: Custom status colors and conversion tracking
- **Visit History**: View all visits for each lead
- **Follow-up Scheduling**: Direct scheduling from lead details

**Key Components**:
- `CreateLeadDialog`: Multi-step lead creation with draft recovery
- `LeadDetailsDialog`: Comprehensive lead information display
- `BulkEditDialog`: Mass lead editing interface
- `PhotoUploadWithValidation`: Image upload with compression and validation

### 3. Visits Management (`/visits`)
**Purpose**: Visit recording and tracking system

**Features**:
- **Multi-view Display**: List, Calendar, and Grid views
- **Visit Recording**: Multi-step form with GPS validation
- **Photo Capture**: Exterior and interior photos with mobile optimization
- **Location Validation**: GPS accuracy checking against lead location
- **Duration Tracking**: Automatic visit duration calculation
- **Visit Types**: Initial, Revisit, and Follow-up categorization
- **Draft Management**: Save & Exit functionality with recovery
- **Status Tracking**: Completed, Scheduled, Cancelled statuses
- **Visit History**: Chronological visit tracking per lead

**Key Components**:
- `RecordVisitDialog`: Multi-step visit recording form
- `VisitDraftRecoveryDialog`: Draft recovery interface
- `PhotoUploadWithValidation`: Mobile-optimized photo capture
- `LocationValidator`: GPS accuracy validation

### 4. Scheduled Follow-ups (`/scheduled-followups`)
**Purpose**: Follow-up task management and tracking

**Features**:
- **Follow-up Creation**: Schedule future follow-ups with notes
- **Status Management**: Pending, Completed, Cancelled statuses
- **Due Date Tracking**: Visual indicators for overdue follow-ups
- **Completion Tracking**: Mark follow-ups as completed with notes
- **Lead Integration**: Direct access to lead details from follow-ups
- **Salesperson Assignment**: Assign follow-ups to specific team members
- **Bulk Operations**: Mass status updates and assignments

**Key Components**:
- `CreateFollowupDialog`: Follow-up scheduling interface
- `FollowupCard`: Individual follow-up display
- `FollowupStatusBadge`: Visual status indicators

### 5. Performance Enhanced (`/performance-enhanced`)
**Purpose**: Advanced performance analytics and team management

**Features**:
- **Team Performance**: Manager and team member statistics
- **Visit Analytics**: Initial visits, revisits, and follow-ups breakdown
- **Target Achievement**: Daily visit targets vs actual performance
- **Working Days Calculation**: Automatic working day computation
- **Date Range Analysis**: Flexible time period analysis
- **Mathematical Consistency**: Ensures visit counts add up correctly
- **Role-based Views**: Different perspectives for each user role

**Key Components**:
- `TeamPerformanceCard`: Comprehensive team statistics
- `SalespersonsSection`: Individual team member performance
- `PerformanceMetrics`: KPI calculations and displays

### 6. Analytics (`/analytics`)
**Purpose**: Data visualization and business intelligence

**Features**:
- **Chart Types**: Bar, Line, Pie, Area, and Radar charts
- **Time Range Analysis**: Daily, Weekly, Monthly, Yearly views
- **Salesperson Filtering**: Individual and team performance analysis
- **Conversion Tracking**: Lead to customer conversion rates
- **Territory Analysis**: Geographic performance breakdown
- **Trend Analysis**: Historical performance trends
- **Export Capabilities**: Chart and data export functionality

**Key Components**:
- `EnhancedCharts`: Advanced chart components
- `WeeklySpendAreaChart`: Spending pattern visualization
- `StoreTypeAreaChart`: Store type performance analysis
- `StatCardsCarousel`: Mobile-optimized metric display

### 7. Territory Coverage (`/territory`)
**Purpose**: Geographic lead visualization and territory management

**Features**:
- **Interactive Map**: Leaflet-based map with custom markers
- **Lead Visualization**: Color-coded markers based on lead status
- **Territory Filtering**: Filter by salesperson and date range
- **Lead Details**: Popup information with quick navigation
- **Coverage Analysis**: Territory coverage statistics
- **Status-based Colors**: Dynamic marker colors from database
- **Mobile Optimization**: Touch-friendly map interactions

**Key Components**:
- `TerritoryMap`: Interactive map component
- `TerritoryHeatmap`: Density visualization
- `TerritoryFilters`: Map filtering controls

### 8. Profile Management (`/profile`)
**Purpose**: User profile and account management

**Features**:
- **Profile Editing**: Name, email, phone, role management
- **Avatar Upload**: Profile picture management
- **Role Display**: Visual role indicators with badges
- **Territory Assignment**: Territory and manager assignment
- **Account Actions**: Sign out and profile updates
- **Permission-based Editing**: Role-based field restrictions

**Key Components**:
- `FileUpload`: Avatar upload component
- `RoleBadge`: Visual role indicators
- `ProfileForm`: Editable profile interface

### 9. Settings (`/settings`)
**Purpose**: System configuration and user preferences

**Features**:
- **Role-based Tabs**: Different settings based on user role
- **System Settings**: Global configuration management
- **User Management**: Create, edit, and manage users
- **Data Management**: Export/import and backup functionality
- **Theme Management**: System branding and appearance
- **Notification Settings**: Push notification configuration
- **Debug Tools**: System diagnostics and cache management

**Settings Tabs**:
- **Overview** (Admin only): System dashboard
- **Appearance**: Theme and branding settings
- **Branding** (Admin only): Company logo and colors
- **Notifications**: Push notification preferences
- **Data**: Export/import functionality
- **Targets** (Admin only): Visit target configuration
- **Backups**: Data backup management
- **Data Management** (Admin only): System data management
- **Conversion Rules** (Admin only): Lead conversion configuration
- **Debug**: System diagnostics
- **Users** (Admin/Manager): User management

---

## Database Schema

### Core Tables

#### `leads` Table
**Purpose**: Central lead information storage

**Key Fields**:
- `id`: Primary key (UUID)
- `store_name`: Business name
- `phone_number`: Contact phone
- `email`: Contact email
- `status`: Lead status (from status_colors table)
- `store_type`: Type of retail business
- `weekly_spend`: Estimated weekly spending
- `notes`: Additional information
- `photo_url`: Main lead photo
- `territory_id`: Foreign key to territories
- `salesperson`: Assigned salesperson name
- `company_name`: Business company name
- `contact_person`: Primary contact name
- `latitude`/`longitude`: GPS coordinates
- `top_3_selling_products`: Array of products
- `exterior_photos`/`interior_photos`: Photo arrays
- `current_supplier`: Current supplier information
- `owns_shop_or_website`: Business type indicator
- `number_of_stores`: Store count
- `manager_id`: Foreign key to users (manager)
- `postal_code`: Location postal code
- `form_start_time`/`form_submit_time`: Form timing
- `form_duration_ms`: Form completion time
- `followup_status`: Follow-up status
- `followup_completed_date`/`followup_completed_time`: Follow-up completion
- `followup_notes`: Follow-up notes
- `status_color_id`: Foreign key to status_colors
- `first_visit_date`/`last_visit_date`: Visit tracking
- `total_visit_count`: Visit count
- `lead_age_days`: Lead age calculation
- `conversion_date`: Conversion tracking
- `lead_status_updated_at`: Status change timestamp

#### `visits` Table
**Purpose**: Visit recording and tracking

**Key Fields**:
- `id`: Primary key (UUID)
- `lead_id`: Foreign key to leads
- `date`/`time`: Visit scheduling
- `status`: Visit status (completed, scheduled, cancelled)
- `salesperson`: Assigned salesperson
- `notes`: Visit notes
- `manager_id`: Foreign key to users (manager)
- `exterior_photos`/`interior_photos`: Photo arrays
- `visit_start_time`/`visit_end_time`: Actual visit timing
- `visit_duration_minutes`: Calculated duration
- `visit_number`: Sequential visit number per lead
- `photo_count`: Total photo count
- `visit_latitude`/`visit_longitude`: GPS coordinates
- `location_validated`: GPS accuracy validation
- `location_accuracy_meters`: GPS accuracy
- `visit_type`: initial, revisit, or followup

#### `users` Table
**Purpose**: User account management

**Key Fields**:
- `id`: Primary key (UUID)
- `email`: User email
- `name`: User display name
- `role`: admin, manager, or salesperson
- `manager_id`: Foreign key to users (for salesperson-manager relationship)
- `created_at`/`updated_at`: Timestamps

#### `profiles` Table
**Purpose**: Extended user profile information

**Key Fields**:
- `id`: Primary key (UUID)
- `email`: User email
- `name`: User display name
- `role`: User role
- `manager_id`: Manager assignment
- `created_at`/`updated_at`: Timestamps

#### `territories` Table
**Purpose**: Geographic territory management

**Key Fields**:
- `id`: Primary key (UUID)
- `city`: Territory city name
- `country`: Territory country
- `status`: Territory status (active, inactive)
- `created_at`/`updated_at`: Timestamps

#### `followups` Table
**Purpose**: Follow-up task management

**Key Fields**:
- `id`: Primary key (UUID)
- `lead_id`: Foreign key to leads
- `salesperson_id`: Foreign key to users
- `status`: Follow-up status
- `scheduled_date`/`scheduled_time`: Follow-up scheduling
- `notes`: Follow-up notes
- `completed_date`/`completed_time`: Completion tracking
- `manager_id`: Foreign key to users (manager)
- `created_at`/`updated_at`: Timestamps

#### `status_colors` Table
**Purpose**: Lead status color management

**Key Fields**:
- `id`: Primary key (integer)
- `status_name`: Status name
- `color_code`: Hex color code
- `background_color`: Background color
- `text_color`: Text color
- `is_active`: Status availability
- `created_at`/`updated_at`: Timestamps

#### `system_settings` Table
**Purpose**: Global system configuration

**Key Fields**:
- `id`: Primary key (UUID)
- `key`: Setting key
- `value`: Setting value (JSON for complex data)
- `description`: Setting description
- `created_at`/`updated_at`: Timestamps

#### `lead_notes` Table
**Purpose**: Lead note history

**Key Fields**:
- `id`: Primary key (integer)
- `lead_id`: Foreign key to leads
- `note_text`: Note content
- `note_type`: Note type
- `created_by`: Foreign key to users
- `created_by_name`: Creator name
- `visit_id`: Foreign key to visits (optional)
- `salesperson_name`: Salesperson name
- `followup_id`: Foreign key to followups (optional)
- `created_at`/`updated_at`: Timestamps

#### `lead_status_history` Table
**Purpose**: Lead status change tracking

**Key Fields**:
- `id`: Primary key (integer)
- `lead_id`: Foreign key to leads
- `old_status`/`new_status`: Status change tracking
- `changed_at`: Change timestamp
- `changed_by`: Foreign key to users
- `conversion_counted`: Conversion tracking flag

#### `conversion_rules` Table
**Purpose**: Lead conversion rule management

**Key Fields**:
- `id`: Primary key (integer)
- `rule_name`: Rule name
- `rule_type`: Rule type
- `from_status`/`to_status`: Status transition
- `is_active`: Rule availability
- `is_default`: Default rule flag
- `created_at`/`updated_at`: Timestamps

### Database Functions & Triggers

#### Visit Management Functions
- `calculate_visit_numbers()`: Automatically assigns sequential visit numbers
- `update_lead_visit_stats()`: Updates lead statistics when visits change
- `set_visit_number()`: Sets visit numbers for new visits
- `calculate_visit_duration()`: Calculates visit duration automatically
- `update_photo_count()`: Updates photo count when photos change

#### Triggers
- `update_lead_stats_on_visit`: Updates lead stats when visits are modified
- `set_visit_number_trigger`: Sets visit numbers for new visits
- `calculate_visit_duration_trigger`: Calculates visit duration
- `update_photo_count_trigger`: Updates photo count

---

## Components & UI Elements

### Layout Components

#### `Sidebar`
**Purpose**: Main navigation component

**Features**:
- **Collapsible Design**: Expandable/collapsible sidebar
- **Role-based Navigation**: Different menu items based on user role
- **Active State**: Current page highlighting
- **Company Logo**: Branded logo display
- **User Profile**: User information and logout
- **Mobile Responsive**: Mobile-optimized navigation

**Navigation Items**:
- Dashboard (`/`)
- Leads (`/leads`)
- Visits (`/visits`)
- Followup (`/scheduled-followups`)
- Performance+ (`/performance-enhanced`)
- Analytics (`/analytics`)
- Territories (`/territory`)
- Profile (`/profile`)
- Settings (`/settings`)

#### `Header`
**Purpose**: Top navigation and user controls

**Features**:
- **Page Title**: Dynamic page titles
- **Breadcrumbs**: Navigation breadcrumbs
- **User Menu**: Profile and logout options
- **Search**: Global search functionality
- **Notifications**: Notification center
- **Theme Toggle**: Dark/light mode switching

### Form Components

#### `CreateLeadDialog`
**Purpose**: Multi-step lead creation form

**Features**:
- **Step Navigation**: 4-step form process
- **Draft Saving**: Auto-save and manual save & exit
- **Validation**: Real-time form validation
- **Photo Upload**: Exterior and interior photo uploads
- **Location Services**: GPS coordinate capture
- **Offline Support**: Offline draft storage
- **Progress Tracking**: Form completion progress

**Steps**:
1. **Basic Information**: Store name, contact details, location
2. **Business Details**: Store type, weekly spend, supplier info
3. **Photos**: Exterior and interior photo uploads
4. **Review & Submit**: Final review and submission

#### `RecordVisitDialog`
**Purpose**: Multi-step visit recording form

**Features**:
- **Step Navigation**: 3-step form process
- **Draft Management**: Save & exit with recovery
- **GPS Validation**: Location accuracy checking
- **Photo Capture**: Mobile-optimized photo capture
- **Duration Tracking**: Automatic visit timing
- **Visit Type**: Initial, revisit, or follow-up categorization
- **Lead Search**: Lead selection with search

**Steps**:
1. **Lead Selection**: Search and select lead
2. **Visit Details**: Date, time, notes, photos
3. **Location & Submit**: GPS validation and submission

#### `DraftRecoveryDialog`
**Purpose**: Draft recovery interface

**Features**:
- **Draft Information**: Display draft details
- **Recovery Options**: Recover or discard draft
- **Draft Type**: Auto-save vs manual-save indication
- **Last Saved**: Timestamp display
- **Progress Indication**: Form step and completion status

### Data Display Components

#### `StatsCard`
**Purpose**: Metric display component

**Features**:
- **Icon Display**: Metric-specific icons
- **Value Display**: Large number display
- **Label**: Descriptive labels
- **Trend Indicators**: Up/down trend arrows
- **Color Coding**: Status-based colors
- **Loading States**: Skeleton loading
- **Click Actions**: Optional click handlers

#### `TeamPerformanceCard`
**Purpose**: Team performance visualization

**Features**:
- **Manager Stats**: Manager performance metrics
- **Team Stats**: Combined team performance
- **Individual Members**: Team member breakdown
- **Target Achievement**: Target vs actual performance
- **Visit Breakdown**: Initial visits, revisits, follow-ups
- **Date Range**: Flexible time period analysis

#### `LeadCard`
**Purpose**: Individual lead display

**Features**:
- **Lead Information**: Store name, contact, status
- **Status Badge**: Color-coded status display
- **Photo Thumbnail**: Lead photo preview
- **Quick Actions**: Edit, view, schedule follow-up
- **Visit Count**: Number of visits indicator
- **Last Visit**: Most recent visit date
- **Territory**: Territory assignment

### Chart Components

#### `EnhancedCharts`
**Purpose**: Advanced chart visualization

**Features**:
- **Chart Types**: Bar, Line, Pie, Area, Radar
- **Interactive**: Hover effects and tooltips
- **Responsive**: Mobile-optimized sizing
- **Customizable**: Color schemes and styling
- **Export**: Chart export functionality
- **Animation**: Smooth transitions

#### `WeeklySpendAreaChart`
**Purpose**: Weekly spending pattern visualization

**Features**:
- **Area Chart**: Spending trend visualization
- **Time Series**: Weekly data points
- **Interactive**: Hover for details
- **Responsive**: Mobile-friendly display
- **Color Coding**: Status-based colors

#### `StoreTypeAreaChart`
**Purpose**: Store type performance analysis

**Features**:
- **Area Chart**: Performance visualization
- **Category Breakdown**: Store type analysis
- **Interactive**: Detailed hover information
- **Responsive**: Mobile optimization
- **Color Coding**: Category-based colors

### Map Components

#### `TerritoryMap`
**Purpose**: Interactive territory visualization

**Features**:
- **Leaflet Integration**: OpenStreetMap tiles
- **Custom Markers**: Status-based colored markers
- **Popup Information**: Lead details on click
- **Zoom Controls**: Map navigation
- **Responsive**: Mobile touch support
- **Filtering**: Salesperson and date filtering

#### `TerritoryHeatmap`
**Purpose**: Lead density visualization

**Features**:
- **Heat Layer**: Density visualization
- **Color Gradients**: Intensity-based colors
- **Interactive**: Hover for details
- **Responsive**: Mobile optimization
- **Performance**: Optimized rendering

### Utility Components

#### `PhotoUploadWithValidation`
**Purpose**: Photo upload with validation

**Features**:
- **File Validation**: Size and type checking
- **Image Compression**: Automatic compression
- **Mobile Camera**: Direct camera access
- **Preview**: Image preview before upload
- **Progress**: Upload progress indication
- **Error Handling**: Validation error display

#### `LocationValidator`
**Purpose**: GPS location validation

**Features**:
- **GPS Capture**: Current location detection
- **Accuracy Checking**: GPS accuracy validation
- **Distance Calculation**: Distance from lead location
- **Validation Rules**: Configurable accuracy thresholds
- **Error Handling**: Location error management
- **Fallback**: Manual location entry

#### `FileUpload`
**Purpose**: General file upload component

**Features**:
- **Multiple Formats**: Various file type support
- **Size Validation**: File size checking
- **Progress Tracking**: Upload progress
- **Preview**: File preview functionality
- **Error Handling**: Upload error management
- **Storage Integration**: Supabase storage integration

---

## Settings & Configuration

### System Settings Management

#### Overview Tab (Admin Only)
**Purpose**: System dashboard and health monitoring

**Features**:
- **System Health**: Database and service status
- **User Statistics**: Active users and roles
- **Data Statistics**: Leads, visits, and follow-ups count
- **Storage Usage**: Photo and file storage usage
- **Performance Metrics**: System performance indicators
- **Recent Activity**: System activity log

#### Lead Statuses Tab
**Purpose**: Lead status configuration

**Features**:
- **Status Management**: Create, edit, delete statuses
- **Color Configuration**: Status color customization
- **Status Ordering**: Status priority ordering
- **Active/Inactive**: Status availability control
- **Default Status**: Default status setting
- **Bulk Operations**: Mass status operations

#### Weekly Spend Tab
**Purpose**: Weekly spend option management

**Features**:
- **Spend Ranges**: Configure spend range options
- **Range Management**: Add, edit, delete ranges
- **Ordering**: Range priority ordering
- **Active/Inactive**: Range availability control
- **Default Ranges**: Default range settings
- **Bulk Operations**: Mass range operations

#### All Settings Tab
**Purpose**: Complete system settings management

**Features**:
- **Setting Categories**: Grouped setting management
- **JSON Settings**: Complex setting configuration
- **Setting Validation**: Setting value validation
- **Import/Export**: Settings backup and restore
- **Default Values**: Setting default management
- **Setting History**: Setting change tracking

### User Management

#### User Creation
**Purpose**: Create new system users

**Features**:
- **User Information**: Name, email, role
- **Role Assignment**: Admin, Manager, Salesperson
- **Manager Assignment**: Salesperson-manager relationship
- **Territory Assignment**: Territory assignment
- **Permission Setting**: Role-based permissions
- **Account Activation**: User account activation

#### User Editing
**Purpose**: Modify existing users

**Features**:
- **Profile Updates**: Name, email, role changes
- **Role Changes**: Role modification with validation
- **Manager Reassignment**: Manager relationship changes
- **Territory Changes**: Territory reassignment
- **Permission Updates**: Permission modification
- **Account Status**: Activate/deactivate accounts

#### User Deletion
**Purpose**: Remove users from system

**Features**:
- **Data Transfer**: Transfer user data to other users
- **Cascade Options**: Handle related data
- **Confirmation**: Deletion confirmation
- **Audit Trail**: Deletion tracking
- **Recovery**: User recovery options
- **Bulk Operations**: Mass user operations

### Data Management

#### Export Functionality
**Purpose**: Data export capabilities

**Features**:
- **Format Options**: CSV, Excel, JSON export
- **Data Selection**: Choose data to export
- **Filtering**: Export filtered data
- **Date Ranges**: Time-based export
- **User Selection**: Export by user/team
- **Scheduled Exports**: Automated exports

#### Import Functionality
**Purpose**: Data import capabilities

**Features**:
- **Format Support**: CSV, Excel import
- **Data Validation**: Import data validation
- **Error Handling**: Import error management
- **Preview**: Import preview
- **Mapping**: Field mapping configuration
- **Batch Processing**: Large data imports

#### Backup Management
**Purpose**: System backup and restore

**Features**:
- **Automated Backups**: Scheduled backups
- **Manual Backups**: On-demand backups
- **Backup Storage**: Cloud storage integration
- **Backup Verification**: Backup integrity checking
- **Restore Options**: Data restore capabilities
- **Backup History**: Backup tracking

### Theme & Branding

#### Appearance Settings
**Purpose**: System appearance configuration

**Features**:
- **Theme Selection**: Light, dark, system themes
- **Color Schemes**: Custom color palettes
- **Font Settings**: Typography configuration
- **Layout Options**: Layout customization
- **Component Styling**: Individual component styling
- **Preview**: Real-time preview

#### Branding Settings (Admin Only)
**Purpose**: Company branding configuration

**Features**:
- **Logo Upload**: Company logo management
- **Color Customization**: Brand color configuration
- **Favicon**: Website favicon
- **Company Information**: Company details
- **Email Templates**: Branded email templates
- **PDF Reports**: Branded report templates

### Notification Settings

#### Push Notifications
**Purpose**: Push notification configuration

**Features**:
- **Notification Types**: Different notification categories
- **User Preferences**: Individual notification settings
- **Delivery Methods**: Email, push, SMS options
- **Timing**: Notification timing configuration
- **Content**: Notification content customization
- **Testing**: Notification testing

#### Email Notifications
**Purpose**: Email notification management

**Features**:
- **Email Templates**: Customizable email templates
- **SMTP Configuration**: Email server settings
- **Delivery Options**: Email delivery preferences
- **Content Management**: Email content editing
- **Testing**: Email testing functionality
- **Delivery Tracking**: Email delivery monitoring

### Target Settings (Admin Only)

#### Visit Targets
**Purpose**: Visit target configuration

**Features**:
- **Daily Targets**: Daily visit targets
- **Weekly Targets**: Weekly visit targets
- **Monthly Targets**: Monthly visit targets
- **User-specific Targets**: Individual user targets
- **Team Targets**: Team-based targets
- **Target Tracking**: Target achievement tracking

#### Performance Targets
**Purpose**: Performance target management

**Features**:
- **Conversion Targets**: Lead conversion targets
- **Revenue Targets**: Revenue-based targets
- **Territory Targets**: Territory-specific targets
- **Time-based Targets**: Time-period targets
- **Target Alerts**: Target achievement alerts
- **Target Reporting**: Target performance reports

### Conversion Rules (Admin Only)

#### Rule Management
**Purpose**: Lead conversion rule configuration

**Features**:
- **Rule Creation**: Create conversion rules
- **Rule Types**: Different rule types
- **Status Transitions**: Status change rules
- **Rule Priority**: Rule execution order
- **Active/Inactive**: Rule availability control
- **Rule Testing**: Rule validation

#### Rule Configuration
**Purpose**: Detailed rule configuration

**Features**:
- **Condition Setting**: Rule conditions
- **Action Definition**: Rule actions
- **Trigger Events**: Rule trigger events
- **Rule Validation**: Rule logic validation
- **Rule History**: Rule change tracking
- **Bulk Operations**: Mass rule operations

### Debug Tools

#### System Diagnostics
**Purpose**: System health monitoring

**Features**:
- **Database Health**: Database connection and performance
- **Service Status**: External service status
- **Error Logging**: System error tracking
- **Performance Metrics**: System performance monitoring
- **Resource Usage**: System resource monitoring
- **Health Checks**: Automated health checks

#### Cache Management
**Purpose**: System cache management

**Features**:
- **Cache Status**: Cache health monitoring
- **Cache Clearing**: Manual cache clearing
- **Cache Statistics**: Cache usage statistics
- **Cache Configuration**: Cache settings
- **Cache Performance**: Cache performance monitoring
- **Cache Optimization**: Cache optimization tools

---

## Technical Stack

### Frontend Dependencies

#### Core Framework
- **React**: 18.3.1 - UI framework
- **TypeScript**: 5.9.2 - Type safety
- **Vite**: 7.1.5 - Build tool and dev server

#### UI & Styling
- **Radix UI**: Complete component library
  - `@radix-ui/react-*`: 20+ UI components
- **Tailwind CSS**: 3.4.3 - Utility-first CSS
- **shadcn/ui**: Pre-built component system
- **Lucide React**: 0.462.0 - Icon library
- **next-themes**: 0.3.0 - Theme management

#### State Management & Data
- **TanStack Query**: 5.56.2 - Server state management
- **React Hook Form**: 7.53.0 - Form management
- **Zod**: 4.0.5 - Schema validation
- **@hookform/resolvers**: 5.1.1 - Form validation

#### Charts & Visualization
- **Recharts**: 3.1.2 - Chart library
- **@nivo/***: 0.99.0 - Advanced chart components
  - `@nivo/bar`, `@nivo/line`, `@nivo/pie`, `@nivo/heatmap`, `@nivo/radar`

#### Maps & Location
- **React Leaflet**: 4.2.1 - Map components
- **Leaflet**: 1.9.4 - Map library
- **leaflet.heat**: 0.2.0 - Heat map functionality
- **leaflet.markercluster**: 1.5.3 - Marker clustering

#### Utilities
- **date-fns**: 3.6.0 - Date manipulation
- **clsx**: 2.1.1 - Conditional classes
- **tailwind-merge**: 2.5.2 - Tailwind class merging
- **class-variance-authority**: 0.7.1 - Component variants

#### Backend Integration
- **@supabase/supabase-js**: 2.51.0 - Supabase client
- **pg**: 8.16.3 - PostgreSQL client

### Development Dependencies

#### Code Quality
- **ESLint**: 9.35.0 - Code linting
- **TypeScript ESLint**: 8.43.0 - TypeScript linting
- **Prettier**: 3.6.2 - Code formatting
- **Husky**: 9.1.7 - Git hooks
- **lint-staged**: 16.1.2 - Pre-commit linting

#### Testing
- **Vitest**: 3.2.4 - Test runner
- **Testing Library**: 16.3.0 - React testing utilities
- **jsdom**: 26.1.0 - DOM simulation

#### Build & Development
- **@vitejs/plugin-react**: 5.0.2 - React plugin
- **@vitejs/plugin-react-swc**: 4.0.1 - SWC React plugin
- **Autoprefixer**: 10.4.19 - CSS prefixing
- **PostCSS**: 8.4.38 - CSS processing
- **Terser**: 5.44.0 - JavaScript minification

#### Type Definitions
- **@types/***: TypeScript type definitions
  - `@types/react`, `@types/react-dom`, `@types/node`
  - `@types/leaflet`, `@types/pg`

### Backend & Infrastructure

#### Database
- **Supabase**: PostgreSQL database
- **Row Level Security**: Data access control
- **Real-time Subscriptions**: Live data updates
- **Database Functions**: Custom SQL functions
- **Triggers**: Automated data processing

#### Storage
- **Supabase Storage**: File and photo storage
- **Image Optimization**: Automatic image processing
- **CDN**: Global content delivery

#### Authentication
- **Supabase Auth**: User authentication
- **PKCE Flow**: Secure authentication flow
- **Session Management**: Automatic token refresh
- **Role-based Access**: User role management

---

## Mobile Responsiveness

### Design Principles

#### Mobile-First Approach
- **Responsive Design**: Mobile-first CSS approach
- **Touch Optimization**: Touch-friendly interface elements
- **Gesture Support**: Swipe and pinch gestures
- **Viewport Optimization**: Proper viewport configuration

#### Breakpoint Strategy
- **Mobile**: < 768px
- **Small Desktop**: 768px - 1280px
- **Desktop**: > 1280px
- **Flexible Layouts**: Adaptive layout system

### Component Adaptations

#### Navigation
- **Collapsible Sidebar**: Mobile sidebar collapse
- **Bottom Navigation**: Mobile bottom navigation
- **Hamburger Menu**: Mobile menu toggle
- **Touch Gestures**: Swipe navigation

#### Forms
- **Full-width Inputs**: Mobile input optimization
- **Large Touch Targets**: 44px minimum touch targets
- **Keyboard Optimization**: Mobile keyboard handling
- **Step Indicators**: Mobile step navigation

#### Data Display
- **Card Layout**: Mobile card-based layouts
- **Swipe Actions**: Mobile swipe interactions
- **Infinite Scroll**: Mobile scrolling optimization
- **Pull-to-Refresh**: Mobile refresh gestures

#### Charts & Maps
- **Responsive Charts**: Mobile chart optimization
- **Touch Maps**: Mobile map interactions
- **Zoom Controls**: Mobile zoom handling
- **Gesture Support**: Map gesture recognition

### Mobile-Specific Features

#### Camera Integration
- **Direct Camera Access**: Mobile camera integration
- **Photo Compression**: Automatic image compression
- **GPS Integration**: Mobile GPS services
- **Offline Support**: Mobile offline functionality

#### Performance Optimization
- **Lazy Loading**: Mobile performance optimization
- **Image Optimization**: Mobile image handling
- **Bundle Splitting**: Mobile bundle optimization
- **Caching**: Mobile caching strategies

---

## Performance Features

### Data Management

#### Caching Strategy
- **React Query**: Server state caching
- **Local Storage**: Client-side data persistence
- **Session Storage**: Session-based caching
- **IndexedDB**: Offline data storage

#### Data Synchronization
- **Real-time Updates**: Supabase real-time subscriptions
- **Optimistic Updates**: Immediate UI updates
- **Conflict Resolution**: Data conflict handling
- **Offline Sync**: Offline data synchronization

### Performance Optimization

#### Code Splitting
- **Route-based Splitting**: Page-level code splitting
- **Component Lazy Loading**: Component-level lazy loading
- **Dynamic Imports**: Dynamic module loading
- **Bundle Analysis**: Bundle size optimization

#### Image Optimization
- **Automatic Compression**: Image compression
- **Lazy Loading**: Image lazy loading
- **WebP Support**: Modern image formats
- **Responsive Images**: Adaptive image sizing

#### Database Optimization
- **Indexing**: Database index optimization
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: Database connection management
- **Caching**: Database query caching

### Monitoring & Analytics

#### Performance Monitoring
- **Core Web Vitals**: Performance metrics
- **Error Tracking**: Error monitoring
- **User Analytics**: User behavior tracking
- **Performance Budgets**: Performance limits

#### System Health
- **Health Checks**: System health monitoring
- **Uptime Monitoring**: Service availability
- **Resource Monitoring**: System resource tracking
- **Alert System**: Performance alerts

---

## Data Management

### Export & Import

#### Export Functionality
- **CSV Export**: Comma-separated value export
- **Excel Export**: Microsoft Excel export
- **JSON Export**: JavaScript Object Notation export
- **PDF Reports**: Portable Document Format reports
- **Custom Formats**: Custom export formats

#### Import Functionality
- **CSV Import**: Comma-separated value import
- **Excel Import**: Microsoft Excel import
- **Data Validation**: Import data validation
- **Error Handling**: Import error management
- **Preview**: Import data preview

#### Data Backup
- **Automated Backups**: Scheduled data backups
- **Manual Backups**: On-demand backups
- **Incremental Backups**: Incremental backup strategy
- **Backup Verification**: Backup integrity checking
- **Restore Options**: Data restore capabilities

### Data Security

#### Access Control
- **Row Level Security**: Database-level access control
- **Role-based Permissions**: User role permissions
- **Data Encryption**: Data encryption at rest
- **Transit Security**: Data encryption in transit

#### Audit Trail
- **Change Tracking**: Data change tracking
- **User Activity**: User activity logging
- **System Events**: System event logging
- **Compliance**: Regulatory compliance

---

## Reporting & Analytics

### Report Generation

#### Report Types
- **Analytics Reports**: Performance analytics
- **Performance Reports**: Team performance
- **Leads Reports**: Lead management reports
- **Visits Reports**: Visit tracking reports
- **Territories Reports**: Territory coverage reports

#### Report Features
- **Custom Sections**: Configurable report sections
- **Date Ranges**: Flexible date filtering
- **User Filtering**: User-specific reports
- **Export Options**: Multiple export formats
- **Scheduled Reports**: Automated report generation

### Analytics Dashboard

#### Key Metrics
- **Conversion Rates**: Lead conversion tracking
- **Visit Performance**: Visit completion rates
- **Territory Coverage**: Geographic coverage analysis
- **Team Performance**: Team productivity metrics
- **Trend Analysis**: Historical trend analysis

#### Visualization
- **Interactive Charts**: Dynamic chart visualization
- **Real-time Updates**: Live data updates
- **Drill-down**: Detailed data exploration
- **Comparative Analysis**: Period-over-period comparison
- **Custom Dashboards**: Personalized dashboard views

---

## Implementation Guidelines

### Development Setup

#### Prerequisites
- **Node.js**: Version 18+ required
- **npm/yarn**: Package manager
- **Git**: Version control
- **Supabase Account**: Backend services

#### Installation
```bash
# Clone repository
git clone <repository-url>
cd ud-leads-liveusage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure Supabase credentials

# Start development server
npm run dev
```

#### Environment Configuration
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

#### Migration Execution
```bash
# Run database migrations
npx supabase db push

# Seed initial data
npm run seed
```

#### Initial Configuration
1. **Create Admin User**: Set up initial admin account
2. **Configure Territories**: Set up geographic territories
3. **Set Status Colors**: Configure lead status colors
4. **System Settings**: Configure system-wide settings

### Deployment

#### Production Build
```bash
# Build for production
npm run build:production

# Deploy to hosting platform
npm run deploy
```

#### Environment Setup
1. **Production Database**: Set up production Supabase instance
2. **Storage Configuration**: Configure file storage
3. **Domain Setup**: Configure custom domain
4. **SSL Certificate**: Set up SSL/TLS

### Maintenance

#### Regular Tasks
- **Database Backups**: Automated daily backups
- **Performance Monitoring**: Regular performance checks
- **Security Updates**: Regular security updates
- **User Management**: User account maintenance

#### Monitoring
- **Error Tracking**: Monitor system errors
- **Performance Metrics**: Track system performance
- **User Analytics**: Monitor user behavior
- **System Health**: Monitor system health

---

## Conclusion

This comprehensive PRD document provides a complete blueprint for building the UD Leads Live Usage system. The system is designed to be scalable, maintainable, and user-friendly, with a focus on mobile-first design and real-time data management.

### Key Success Factors
1. **User Experience**: Intuitive interface with role-based access
2. **Performance**: Optimized for speed and reliability
3. **Scalability**: Built to handle growing user base and data
4. **Security**: Robust security with role-based permissions
5. **Mobile Support**: Full mobile optimization for field teams
6. **Real-time Data**: Live updates and synchronization
7. **Offline Capability**: Works without internet connection
8. **Analytics**: Comprehensive reporting and insights

### Future Enhancements
- **AI Integration**: Machine learning for lead scoring
- **Advanced Analytics**: Predictive analytics and insights
- **Integration APIs**: Third-party system integrations
- **Mobile App**: Native mobile applications
- **Advanced Reporting**: Custom report builder
- **Workflow Automation**: Automated business processes

This system provides a solid foundation for retail lead management and can be extended with additional features as business needs evolve.
