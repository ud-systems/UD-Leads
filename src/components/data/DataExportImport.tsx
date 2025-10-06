import { useState, useMemo } from "react";
import { Download, Upload, FileText, Database, Users, Building, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUsers } from "@/hooks/useUsers";
import { useTerritories } from "@/hooks/useTerritories";
import { useStoreTypeOptions, useBuyingPowerOptions, useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getUKTime, getUKDate } from "@/utils/timeUtils";

export function DataExportImport() {
  const [exportType, setExportType] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: leads } = useLeads();
  const { data: suppliers } = useSuppliers();
  const { data: users = [] } = useUsers();
  const { data: territories = [] } = useTerritories();
  const { data: storeTypeOptions = [] } = useStoreTypeOptions();
  const { data: buyingPowerOptions = [] } = useBuyingPowerOptions();
  const { data: statusOptions = [] } = useLeadStatusOptions();
  const { isAdmin, isManager, isSalesperson } = useRoleAccess();

  // Filter users based on role and team assignment
  const salespeople = useMemo(() => {
    if (isAdmin) {
      // Admins can see all salespeople and managers
      return users.filter(user => {
        const role = (user as any).role;
        return role === 'salesperson' || role === 'manager';
      }).map(user => (user as any).name);
    } else if (isManager && user) {
      // Managers can see themselves and their team members
      return users.filter(u => {
        const userRole = (u as any).role;
        const userId = u.id;
        
        // Include themselves (manager)
        if (userId === user.id && userRole === 'manager') {
          return true;
        }
        
        // Include their team members (salespeople assigned to them)
        if (userRole === 'salesperson' && (u as any).manager_id === user.id) {
          return true;
        }
        
        return false;
      }).map(u => (u as any).name);
    } else if (isSalesperson) {
      // Salespeople can only see themselves
      return users.filter(u => u.id === user?.id).map(u => (u as any).name);
    }
    
    return [];
  }, [users, isAdmin, isManager, isSalesperson, user]);

  const exportOptions = [
    { value: "leads", label: "Leads", icon: Building, count: leads?.length || 0 },
    { value: "suppliers", label: "Suppliers", icon: Users, count: suppliers?.length || 0 },
    { value: "all", label: "All Data", icon: Database, count: (leads?.length || 0) + (suppliers?.length || 0) }
  ];

  const generateTemplate = async () => {
    if (salespeople.length === 0 || territories.length === 0) {
      toast({
        title: "Cannot generate template",
        description: "No salespeople or territories found in the system",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingTemplate(true);
    try {
      // UK City coordinates for accurate territory mapping
      const ukCities = {
        'London': { lat: 51.5074, lng: -0.1278 },
        'Manchester': { lat: 53.4808, lng: -2.2426 },
        'Birmingham': { lat: 52.4862, lng: -1.8904 },
        'Leeds': { lat: 53.8008, lng: -1.5491 },
        'Liverpool': { lat: 53.4084, lng: -2.9916 },
        'Sheffield': { lat: 53.3811, lng: -1.4701 },
        'Edinburgh': { lat: 55.9533, lng: -3.1883 },
        'Bristol': { lat: 51.4545, lng: -2.5879 },
        'Glasgow': { lat: 55.8642, lng: -4.2518 },
        'Cardiff': { lat: 51.4816, lng: -3.1791 },
        'Newcastle': { lat: 54.9783, lng: -1.6178 },
        'Nottingham': { lat: 52.9548, lng: -1.1581 },
        'Leicester': { lat: 52.6369, lng: -1.1398 },
        'Coventry': { lat: 52.4068, lng: -1.5197 },
        'Bradford': { lat: 53.8008, lng: -1.5491 },
        'Stoke-on-Trent': { lat: 53.0027, lng: -2.1794 },
        'Wolverhampton': { lat: 52.5862, lng: -2.1286 },
        'Plymouth': { lat: 50.3755, lng: -4.1427 },
        'Southampton': { lat: 50.9097, lng: -1.4044 },
        'Reading': { lat: 51.4543, lng: -0.9781 },
        'Derby': { lat: 52.9225, lng: -1.4746 },
        'Portsmouth': { lat: 50.8198, lng: -1.1139 },
        'Brighton': { lat: 50.8225, lng: -0.1372 },
        'Milton Keynes': { lat: 52.0417, lng: -0.7558 },
        'Northampton': { lat: 52.2405, lng: -0.9027 },
        'Aberdeen': { lat: 57.1497, lng: -2.0943 },
        'Norwich': { lat: 52.6309, lng: 1.2974 },
        'Bournemouth': { lat: 50.7192, lng: -1.8808 },
        'Swansea': { lat: 51.6214, lng: -3.9436 },
        'Oxford': { lat: 51.7520, lng: -1.2577 },
        'Cambridge': { lat: 52.2053, lng: 0.1218 },
        'York': { lat: 53.9600, lng: -1.0873 },
        'Peterborough': { lat: 52.5695, lng: -0.2405 },
        'Dundee': { lat: 56.4620, lng: -2.9707 },
        'Exeter': { lat: 50.7184, lng: -3.5339 },
        'Gloucester': { lat: 51.8642, lng: -2.2380 },
        'Chester': { lat: 53.1934, lng: -2.8931 },
        'Lincoln': { lat: 53.2307, lng: -0.5406 },
        'Worcester': { lat: 52.1920, lng: -2.2215 },
        'Bath': { lat: 51.3758, lng: -2.3599 },
        'Canterbury': { lat: 51.2802, lng: 1.0789 },
        'Durham': { lat: 54.7761, lng: -1.5733 },
        'Carlisle': { lat: 54.8925, lng: -2.9329 },
        'Lancaster': { lat: 54.0470, lng: -2.8010 },
        'Winchester': { lat: 51.0595, lng: -1.3100 },
        'Salisbury': { lat: 51.0688, lng: -1.7945 },
        'Truro': { lat: 50.2632, lng: -5.0510 },
        'Inverness': { lat: 57.4778, lng: -4.2247 },
        'Perth': { lat: 56.3950, lng: -3.4308 },
        'Stirling': { lat: 56.1165, lng: -3.9369 }
      };

      // Comprehensive store name variations
      const storeNamePrefixes = [
        "Quick", "Express", "City", "Corner", "Neighborhood", "Community", "Metro", "Urban", "Suburban", "Local",
        "Regional", "National", "Independent", "Franchise", "Retail", "Market", "Shop", "Store", "Mart", "Stop",
        "Go", "Plus", "Pro", "Elite", "Premium", "Value", "Discount", "Family", "Convenience", "Super"
      ];

      const storeNameSuffixes = [
        "Stop", "Mart", "Store", "Shop", "Market", "Convenience", "Express", "Quick", "Go", "Plus",
        "Corner", "Center", "Hub", "Zone", "Outlet", "Depot", "Station", "Point", "Spot", "Place"
      ];

      const storeTypes = [
        "Vape Shop", "Convenience Store", "Supermarket", "Tobacco Shop", "Gas Station", "Pharmacy", "Other"
      ];

      const buyingPowers = ["Low", "Medium", "High"];
      const statuses = [
        "New Prospect", "In Discussion", "Trial Order", "Converted", "Visited - Follow-Up Required", "Visited - No Interest"
      ];

      const productCategories = [
        "Tobacco", "Vapes", "Convenience Items", "Beverages", "Snacks", "Confectionery", "Household", "Personal Care",
        "Automotive", "Stationery", "Gifts", "Electronics", "Clothing", "Footwear", "Sports", "Books", "Music",
        "Toys", "Garden", "DIY", "Pet Supplies", "Baby Products", "Health & Beauty", "Frozen Foods", "Fresh Produce"
      ];

      const companyNamePrefixes = [
        "ABC", "XYZ", "Quick", "City", "Metro", "Urban", "Suburban", "Local", "Regional", "National",
        "Independent", "Franchise", "Retail", "Market", "Shop", "Store", "Mart", "Stop", "Go", "Plus",
        "Pro", "Elite", "Premium", "Value", "Discount", "Family", "Convenience", "Super", "Mega", "Ultra"
      ];

      const companyNameSuffixes = [
        "Retail", "Corp", "Inc", "LLC", "Ltd", "Co", "Group", "Enterprises", "Stores", "Markets",
        "Shops", "Convenience", "Express", "Quick", "Go", "Plus", "Pro", "Elite", "Premium", "Value"
      ];

      const contactFirstNames = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
        "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen",
        "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Helen", "Mark", "Sandra",
        "Donald", "Donna", "Steven", "Carol", "Paul", "Ruth", "Andrew", "Sharon", "Joshua", "Michelle",
        "Kenneth", "Laura", "Kevin", "Emily", "Brian", "Kimberly", "George", "Deborah", "Edward", "Dorothy",
        "Ronald", "Lisa", "Timothy", "Nancy", "Jason", "Karen", "Jeffrey", "Betty", "Ryan", "Helen",
        "Jacob", "Sandra", "Gary", "Donna", "Nicholas", "Carol", "Eric", "Ruth", "Jonathan", "Sharon",
        "Stephen", "Michelle", "Larry", "Laura", "Justin", "Sarah", "Scott", "Kimberly", "Brandon", "Deborah",
        "Benjamin", "Dorothy", "Samuel", "Lisa", "Frank", "Nancy", "Gregory", "Karen", "Raymond", "Betty",
        "Alexander", "Helen", "Patrick", "Sandra", "Jack", "Donna", "Dennis", "Carol", "Jerry", "Ruth"
      ];

      const contactLastNames = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
        "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
        "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
        "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
        "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
        "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Torres",
        "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett",
        "Wood", "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson"
      ];

      // Generate 300 varied leads
      const dummyLeads = [];
      const startDate = new Date('2024-01-01');
      const endDate = new Date();
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = 0; i < 300; i++) {
        // Generate random date between start and end date
        const randomDays = Math.floor(Math.random() * totalDays);
        const createdDate = new Date(startDate.getTime() + (randomDays * 24 * 60 * 60 * 1000));
        
        // Generate random last visit date (within 90 days of creation)
        const lastVisitDays = Math.floor(Math.random() * 90);
        const lastVisitDate = new Date(createdDate.getTime() + (lastVisitDays * 24 * 60 * 60 * 1000));
        
        // Generate random next visit date (within next 60 days)
        const nextVisitDays = Math.floor(Math.random() * 60) + 1;
        const nextVisitDate = new Date(new Date().getTime() + (nextVisitDays * 24 * 60 * 60 * 1000));

        // Select random territory and get its coordinates
        const randomTerritory = territories[Math.floor(Math.random() * territories.length)];
        const cityCoords = ukCities[randomTerritory.city as keyof typeof ukCities] || ukCities['London'];
        
        // Add some variation to coordinates within the city
        const latVariation = (Math.random() - 0.5) * 0.02; // ±0.01 degrees (~1km)
        const lngVariation = (Math.random() - 0.5) * 0.02;
        
        // Generate store name
        const prefix = storeNamePrefixes[Math.floor(Math.random() * storeNamePrefixes.length)];
        const suffix = storeNameSuffixes[Math.floor(Math.random() * storeNameSuffixes.length)];
        const storeNumber = Math.floor(Math.random() * 999) + 1;
        const storeName = `${prefix} ${suffix} ${storeNumber}`;

        // Generate company name
        const companyPrefix = companyNamePrefixes[Math.floor(Math.random() * companyNamePrefixes.length)];
        const companySuffix = companyNameSuffixes[Math.floor(Math.random() * companyNameSuffixes.length)];
        const companyName = `${companyPrefix} ${companySuffix}`;

        // Generate contact person
        const firstName = contactFirstNames[Math.floor(Math.random() * contactFirstNames.length)];
        const lastName = contactLastNames[Math.floor(Math.random() * contactLastNames.length)];
        const contactPerson = `${firstName} ${lastName}`;

        // Generate phone number (UK format)
        const areaCode = ['20', '21', '24', '28', '29', '11', '12', '13', '14', '15', '16', '17', '18', '19'][Math.floor(Math.random() * 14)];
        const phoneNumber = `+44 ${areaCode} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;

        // Generate email
        const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`;

        // Generate products (1-4 random products)
        const numProducts = Math.floor(Math.random() * 4) + 1;
        const selectedProducts = [];
        const shuffledProducts = [...productCategories].sort(() => 0.5 - Math.random());
        for (let j = 0; j < numProducts; j++) {
          selectedProducts.push(shuffledProducts[j]);
        }

        // Select random salesperson and get their manager
        const randomSalesperson = salespeople[Math.floor(Math.random() * salespeople.length)];
        const salespersonUser = users.find(u => (u as any).name === randomSalesperson);
        
        // Determine manager_id based on current user's role
        let managerId = null;
        if (isManager) {
          // If current user is a manager, use their ID
          managerId = user?.id;
        } else if (isSalesperson) {
          // If current user is a salesperson, use their manager's ID
          managerId = profile?.manager_id;
        } else if (isAdmin) {
          // If current user is admin, use the salesperson's manager or null
          managerId = salespersonUser ? (salespersonUser as any).manager_id : null;
        }

        // Generate notes with variety
        const noteTemplates = [
          `Store shows ${Math.random() > 0.5 ? 'good' : 'moderate'} potential for our products. Owner is ${Math.random() > 0.5 ? 'interested' : 'cautious'} in expanding their range.`,
          `Located in a ${Math.random() > 0.5 ? 'busy' : 'quiet'} area with ${Math.random() > 0.5 ? 'high' : 'moderate'} foot traffic. Current product range is ${Math.random() > 0.5 ? 'limited' : 'diverse'}.`,
          `Store has been in business for ${Math.floor(Math.random() * 20) + 5} years. Owner is ${Math.random() > 0.5 ? 'open to new products' : 'traditional in approach'}.`,
          `Competition in the area is ${Math.random() > 0.5 ? 'high' : 'moderate'}. Store has ${Math.random() > 0.5 ? 'good' : 'average'} customer loyalty.`,
          `Store recently ${Math.random() > 0.5 ? 'expanded' : 'renovated'}. Owner is looking to ${Math.random() > 0.5 ? 'increase sales' : 'diversify products'}.`,
          `Located near ${Math.random() > 0.5 ? 'schools' : 'offices'}. Customer base is primarily ${Math.random() > 0.5 ? 'young professionals' : 'families'}.`,
          `Store has ${Math.random() > 0.5 ? 'online presence' : 'traditional approach'}. Owner is ${Math.random() > 0.5 ? 'tech-savvy' : 'hands-on'}.`,
          `Area demographics show ${Math.random() > 0.5 ? 'growing' : 'stable'} population. Store has ${Math.random() > 0.5 ? 'good' : 'moderate'} growth potential.`
        ];

        const lead = {
          store_name: storeName,
          company_name: companyName,
          contact_person: contactPerson,
          phone_number: phoneNumber,
          email: email,
          store_type: storeTypes[Math.floor(Math.random() * storeTypes.length)],
          buying_power: buyingPowers[Math.floor(Math.random() * buyingPowers.length)],
          territory_id: randomTerritory.id,
          latitude: (cityCoords.lat + latVariation).toFixed(6),
          longitude: (cityCoords.lng + lngVariation).toFixed(6),
          top_3_selling_products: selectedProducts,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          salesperson: randomSalesperson,
          last_visit: lastVisitDate.toISOString().split('T')[0],
          next_visit: nextVisitDate.toISOString().split('T')[0],
          exterior_photo_url: "",
          interior_photo_url: "",
          notes: noteTemplates[Math.floor(Math.random() * noteTemplates.length)],
          manager_id: managerId,
          created_at: createdDate.toISOString(),
          updated_at: new Date().toISOString()
        };
        
        dummyLeads.push(lead);
      }

      // Convert to CSV with proper escaping (same as export function)
      const headers = Object.keys(dummyLeads[0]);
      
      // Helper function to properly escape CSV values
      const escapeCsvValue = (value: any): string => {
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert arrays to comma-separated strings
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        
        // Convert to string and handle special characters
        const stringValue = String(value);
        
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      };
      
      const csvContent = [
        headers.map(h => escapeCsvValue(h)).join(','),
        ...dummyLeads.map(row => 
          headers.map(header => escapeCsvValue(row[header])).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads_template_300_entries.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template generated successfully",
        description: "300 varied leads template downloaded with accurate UK coordinates and comprehensive data variations.",
      });
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: "Template generation failed",
        description: "An error occurred while generating the template",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleExport = async () => {
    if (!exportType) return;

    setIsExporting(true);
    try {
      let data: any[] = [];
      let filename = "";

      switch (exportType) {
        case "leads":
          data = leads || [];
          filename = "leads.csv";
          break;
        case "suppliers":
          data = suppliers || [];
          filename = "suppliers.csv";
          break;
        case "all":
          data = [
            ...(leads || []).map(l => ({ ...l, type: 'lead' })),
            ...(suppliers || []).map(s => ({ ...s, type: 'supplier' }))
          ];
          filename = "all_data.csv";
          break;
      }

      // Convert to CSV with proper escaping
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        
        // Helper function to properly escape CSV values
        const escapeCsvValue = (value: any): string => {
          if (value === null || value === undefined) {
            return '';
          }
          
          // Convert arrays to comma-separated strings
          if (Array.isArray(value)) {
            value = value.join(', ');
          }
          
          // Convert to string and handle special characters
          const stringValue = String(value);
          
          // If value contains comma, quote, or newline, wrap in quotes and escape quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        };
        
        const csvContent = [
          headers.map(h => escapeCsvValue(h)).join(','),
          ...data.map(row => 
            headers.map(header => escapeCsvValue(row[header])).join(',')
          )
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: `${data.length} records exported to ${filename}`,
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim()); // Remove empty lines
      
      // Helper function to properly parse CSV line respecting quotes
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i += 2;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }
        
        // Add the last field
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
      
      // Parse CSV data with proper quote handling
      const rawData = lines.slice(1).map(line => {
        const values = parseCsvLine(line).map(v => v.replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          // Convert empty strings to null for UUID fields
          const value = values[index] || '';
          if (header === 'territory_id' || header === 'manager_id') {
            obj[header] = value === '' ? null : value;
          } else {
            obj[header] = value;
          }
        });
        return obj;
      }).filter(row => Object.values(row).some(val => val && val !== '')); // Remove empty rows

      console.log("Parsed CSV data:", rawData);
      console.log("Sample raw data (first 3 rows):", rawData.slice(0, 3));
      console.log("CSV headers:", headers);

      // Validate and transform data for database insertion
      const validatedLeads = [];
      const errors = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +2 because we start from line 2 (after headers)

        try {
          // Validate required fields
          if (!row.store_name || !row.contact_person || !row.phone_number) {
            errors.push(`Row ${rowNumber}: Missing required fields (store_name, contact_person, phone_number)`);
            continue;
          }

          // Validate coordinates are provided
          if (!row.latitude || !row.longitude) {
            errors.push(`Row ${rowNumber}: Missing required coordinates (latitude, longitude)`);
            continue;
          }

          // Validate coordinates are valid numbers
          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);
          if (isNaN(lat) || isNaN(lng)) {
            errors.push(`Row ${rowNumber}: Invalid coordinates (latitude: ${row.latitude}, longitude: ${row.longitude})`);
            continue;
          }

          // Validate salesperson exists
          if (row.salesperson && !salespeople.includes(row.salesperson)) {
            errors.push(`Row ${rowNumber}: Invalid salesperson "${row.salesperson}"`);
            continue;
          }

          // Validate territory exists
          if (row.territory_id && row.territory_id.trim() !== '') {
            const territoryExists = territories.some(t => t.id === row.territory_id);
            if (!territoryExists) {
              errors.push(`Row ${rowNumber}: Invalid territory_id "${row.territory_id}"`);
              continue;
            }
          }

          // Validate manager exists (if provided)
          if (row.manager_id && row.manager_id.trim() !== '') {
            const managerExists = users.some(u => u.id === row.manager_id && (u as any).role === 'manager');
            if (!managerExists) {
              errors.push(`Row ${rowNumber}: Invalid manager_id "${row.manager_id}"`);
              continue;
            }
          }

          // Determine manager_id based on current user's role if not provided
          let finalManagerId = row.manager_id && row.manager_id.trim() !== '' ? row.manager_id : null;
          if (!finalManagerId) {
            if (isManager) {
              finalManagerId = user?.id;
            } else if (isSalesperson) {
              finalManagerId = profile?.manager_id;
            }
          }

          // Validate store type
          if (row.store_type && !storeTypeOptions.includes(row.store_type)) {
            errors.push(`Row ${rowNumber}: Invalid store_type "${row.store_type}"`);
            continue;
          }

          // Validate weekly spend
          if (row.weekly_spend && !buyingPowerOptions.includes(row.weekly_spend)) {
            errors.push(`Row ${rowNumber}: Invalid weekly_spend "${row.weekly_spend}"`);
            continue;
          }

          // Validate status
          if (row.status && !statusOptions.includes(row.status)) {
            errors.push(`Row ${rowNumber}: Invalid status "${row.status}"`);
            continue;
          }

          // Transform data for database
          const leadData = {
            store_name: row.store_name,
            company_name: row.company_name || '',
            contact_person: row.contact_person,
            phone_number: row.phone_number,
            email: row.email || '',
            store_type: row.store_type || '',
            weekly_spend: row.weekly_spend || '',
            territory_id: row.territory_id && row.territory_id.trim() !== '' ? row.territory_id : null,
            latitude: lat,
            longitude: lng,
            top_3_selling_products: row.top_3_selling_products ? 
              row.top_3_selling_products.split(',').map(p => p.trim()).filter(p => p) : 
              [],
            status: row.status || 'New Prospect',
            salesperson: row.salesperson || '',
            last_visit: row.last_visit && row.last_visit.trim() !== '' ? row.last_visit : null,
            next_visit: row.next_visit && row.next_visit.trim() !== '' ? row.next_visit : null,
            exterior_photo_url: row.exterior_photo_url || '',
            interior_photo_url: row.interior_photo_url || '',
            notes: row.notes || '',
            manager_id: finalManagerId,
            created_at: row.created_at && row.created_at.trim() !== '' ? row.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          validatedLeads.push(leadData);
        } catch (error) {
          errors.push(`Row ${rowNumber}: Error processing row - ${error}`);
        }
      }

      // Show validation errors if any
      if (errors.length > 0) {
        toast({
          title: "Validation Errors",
          description: `${errors.length} errors found. Check console for details.`,
          variant: "destructive",
        });
        console.error("Import validation errors:", errors);
        console.error("First 5 validation errors:", errors.slice(0, 5));
        
        if (validatedLeads.length === 0) {
          return; // Don't proceed if no valid leads
        }
      }

      // Insert valid leads into database
      const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(validatedLeads)
        .select();

      if (insertError) {
        console.error('Database insertion error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('Successfully inserted leads:', insertedLeads?.length || 0);
      console.log('Sample inserted leads:', insertedLeads?.slice(0, 3).map(lead => ({
        id: lead.id,
        store_name: lead.store_name,
        salesperson: lead.salesperson,
        manager_id: lead.manager_id,
        territory_id: lead.territory_id
      })));

      // Auto-create initial visits for each imported lead using UK timezone
      const currentTime = getUKTime();

      const visitPromises = insertedLeads.map(lead => {
        // Use lead's last_visit date if available, otherwise use next_visit, fallback to current UK date
        const visitDate = lead.last_visit || lead.next_visit || getUKDate();
        
        return supabase
          .from('visits')
          .insert({
            lead_id: lead.id,
            date: visitDate,
            time: currentTime,
            status: 'completed',
            salesperson: lead.salesperson || profile?.name || user?.email || 'Unknown',
            notes: lead.notes || 'Initial lead discovery - Imported via bulk upload',
            manager_id: lead.manager_id || (isManager ? user?.id : profile?.manager_id)
          });
      });

      const visitResults = await Promise.all(visitPromises);
      const visitErrors = visitResults.filter(result => result.error);

      if (visitErrors.length > 0) {
        console.warn('Some visits failed to create:', visitErrors);
        // Don't fail the entire import if visits fail
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });

      const successMessage = `Successfully imported ${validatedLeads.length} leads`;
      const visitMessage = visitErrors.length > 0 
        ? ` (${insertedLeads.length - visitErrors.length} visits created)`
        : ` (${insertedLeads.length} visits created)`;

      toast({
        title: "Import Successful",
        description: successMessage + visitMessage,
      });
      
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please check your file format and try again",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Export your data to CSV format for backup or analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-type">Select data to export</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose export type" />
              </SelectTrigger>
              <SelectContent>
                {exportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {option.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleExport}
            disabled={!exportType || isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Download Template
          </CardTitle>
          <CardDescription>
            Get a template with 100 dummy leads for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>• 100 realistic dummy leads</p>
            <p>• Spans from January 2025 to current date</p>
            <p>• Uses actual system data (salespeople, territories, options)</p>
            <p>• Perfect for testing import functionality</p>
          </div>

          <Button 
            onClick={generateTemplate}
            disabled={isGeneratingTemplate || salespeople.length === 0 || territories.length === 0}
            className="w-full"
            variant="outline"
          >
            {isGeneratingTemplate ? (
              <>Generating Template...</>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download Template
              </>
            )}
          </Button>

          {(salespeople.length === 0 || territories.length === 0) && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <p>⚠️ Template requires salespeople and territories in the system</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Leads
          </CardTitle>
          <CardDescription>
            Import leads from CSV files directly into your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-file">Choose CSV file</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>

          {importFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <Button 
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>Importing to Database...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import to Database
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• CSV files should have headers in the first row</p>
            <p>• Required fields: store_name, contact_person, phone_number</p>
            <p>• Salesperson names must exist in the system</p>
            <p>• Territory IDs must be valid</p>
            <p>• Store types and buying power must match system options</p>
            <p>• Top 3 Selling Products: comma-separated values (e.g., "Tobacco, Vapes")</p>
            <p>• Data will be validated before import</p>
            <p>• Imported leads will appear immediately in the leads table</p>
            <p>• Initial visits will be automatically created for each imported lead</p>
            <p>• Visit dates will reflect the lead's last_visit or next_visit date</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}