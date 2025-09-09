// Import the admin client for data insertion operations
import { runDatabaseOperation } from './databaseOperations';
import { TablesInsert } from '@/integrations/supabase/types';

// UK Cities data - using correct column names: city, country, status
const ukCities: TablesInsert<'territories'>[] = [
  { city: 'London', country: 'United Kingdom', status: 'active' },
  { city: 'Birmingham', country: 'United Kingdom', status: 'active' },
  { city: 'Manchester', country: 'United Kingdom', status: 'active' },
  { city: 'Glasgow', country: 'United Kingdom', status: 'active' },
  { city: 'Liverpool', country: 'United Kingdom', status: 'active' },
  { city: 'Leeds', country: 'United Kingdom', status: 'active' },
  { city: 'Sheffield', country: 'United Kingdom', status: 'active' },
  { city: 'Edinburgh', country: 'United Kingdom', status: 'active' },
  { city: 'Bristol', country: 'United Kingdom', status: 'active' },
  { city: 'Cardiff', country: 'United Kingdom', status: 'active' },
  { city: 'Newcastle', country: 'United Kingdom', status: 'active' },
  { city: 'Belfast', country: 'United Kingdom', status: 'active' },
  { city: 'Nottingham', country: 'United Kingdom', status: 'active' },
  { city: 'Leicester', country: 'United Kingdom', status: 'active' },
  { city: 'Coventry', country: 'United Kingdom', status: 'active' },
  { city: 'Bradford', country: 'United Kingdom', status: 'active' },
  { city: 'Stoke-on-Trent', country: 'United Kingdom', status: 'active' },
  { city: 'Wolverhampton', country: 'United Kingdom', status: 'active' },
  { city: 'Plymouth', country: 'United Kingdom', status: 'active' },
  { city: 'Southampton', country: 'United Kingdom', status: 'active' },
  { city: 'Reading', country: 'United Kingdom', status: 'active' },
  { city: 'Derby', country: 'United Kingdom', status: 'active' },
  { city: 'Dudley', country: 'United Kingdom', status: 'active' },
  { city: 'Northampton', country: 'United Kingdom', status: 'active' },
  { city: 'Portsmouth', country: 'United Kingdom', status: 'active' },
  { city: 'Luton', country: 'United Kingdom', status: 'active' },
  { city: 'Preston', country: 'United Kingdom', status: 'active' },
  { city: 'Sunderland', country: 'United Kingdom', status: 'active' },
  { city: 'Norwich', country: 'United Kingdom', status: 'active' },
  { city: 'Walsall', country: 'United Kingdom', status: 'active' },
  { city: 'Bournemouth', country: 'United Kingdom', status: 'active' },
  { city: 'Southend-on-Sea', country: 'United Kingdom', status: 'active' },
  { city: 'Swindon', country: 'United Kingdom', status: 'active' },
  { city: 'Huddersfield', country: 'United Kingdom', status: 'active' },
  { city: 'Oxford', country: 'United Kingdom', status: 'active' },
  { city: 'Middlesbrough', country: 'United Kingdom', status: 'active' },
  { city: 'Blackpool', country: 'United Kingdom', status: 'active' },
  { city: 'Bolton', country: 'United Kingdom', status: 'active' },
  { city: 'Ipswich', country: 'United Kingdom', status: 'active' },
  { city: 'York', country: 'United Kingdom', status: 'active' },
  { city: 'West Bromwich', country: 'United Kingdom', status: 'active' },
  { city: 'Peterborough', country: 'United Kingdom', status: 'active' },
  { city: 'Stockport', country: 'United Kingdom', status: 'active' },
  { city: 'Brighton', country: 'United Kingdom', status: 'active' },
  { city: 'Slough', country: 'United Kingdom', status: 'active' },
  { city: 'Gloucester', country: 'United Kingdom', status: 'active' },
  { city: 'Rotherham', country: 'United Kingdom', status: 'active' },
  { city: 'Cambridge', country: 'United Kingdom', status: 'active' },
  { city: 'Exeter', country: 'United Kingdom', status: 'active' },
  { city: 'Eastbourne', country: 'United Kingdom', status: 'active' },
  { city: 'Sutton Coldfield', country: 'United Kingdom', status: 'active' },
  { city: 'Blackburn', country: 'United Kingdom', status: 'active' },
  { city: 'Colchester', country: 'United Kingdom', status: 'active' },
  { city: 'Oldham', country: 'United Kingdom', status: 'active' },
  { city: 'St Helens', country: 'United Kingdom', status: 'active' },
  { city: 'Worcester', country: 'United Kingdom', status: 'active' },
  { city: 'Cheltenham', country: 'United Kingdom', status: 'active' },
  { city: 'Watford', country: 'United Kingdom', status: 'active' },
  { city: 'Gateshead', country: 'United Kingdom', status: 'active' },
  { city: 'Woking', country: 'United Kingdom', status: 'active' },
  { city: 'Warrington', country: 'United Kingdom', status: 'active' },
  { city: 'Dundee', country: 'United Kingdom', status: 'active' },
  { city: 'Basildon', country: 'United Kingdom', status: 'active' },
  { city: 'Milton Keynes', country: 'United Kingdom', status: 'active' },
  { city: 'Bury', country: 'United Kingdom', status: 'active' },
  { city: 'Salford', country: 'United Kingdom', status: 'active' },
  { city: 'Doncaster', country: 'United Kingdom', status: 'active' },
  { city: 'Gillingham', country: 'United Kingdom', status: 'active' },
  { city: 'Burnley', country: 'United Kingdom', status: 'active' },
  { city: 'Telford', country: 'United Kingdom', status: 'active' },
  { city: 'Mansfield', country: 'United Kingdom', status: 'active' },
  { city: 'Chesterfield', country: 'United Kingdom', status: 'active' },
  { city: 'Crewe', country: 'United Kingdom', status: 'active' },
  { city: 'Scunthorpe', country: 'United Kingdom', status: 'active' },
  { city: 'Grimsby', country: 'United Kingdom', status: 'active' },
  { city: 'Barnsley', country: 'United Kingdom', status: 'active' },
  { city: 'Wrexham', country: 'United Kingdom', status: 'active' },
  { city: 'Maidstone', country: 'United Kingdom', status: 'active' },
  { city: 'Chester', country: 'United Kingdom', status: 'active' },
  { city: 'Bedford', country: 'United Kingdom', status: 'active' },
  { city: 'Crawley', country: 'United Kingdom', status: 'active' },
  { city: 'Carlisle', country: 'United Kingdom', status: 'active' },
  { city: 'Weston-super-Mare', country: 'United Kingdom', status: 'active' },
  { city: 'Guildford', country: 'United Kingdom', status: 'active' },
  { city: 'Lancaster', country: 'United Kingdom', status: 'active' },
  { city: 'Southport', country: 'United Kingdom', status: 'active' },
  { city: 'Bath', country: 'United Kingdom', status: 'active' },
  { city: 'Poole', country: 'United Kingdom', status: 'active' },
  { city: 'Solihull', country: 'United Kingdom', status: 'active' },
  { city: 'Harrow', country: 'United Kingdom', status: 'active' },
  { city: 'Dartford', country: 'United Kingdom', status: 'active' },
  { city: 'High Wycombe', country: 'United Kingdom', status: 'active' },
  { city: 'Redditch', country: 'United Kingdom', status: 'active' },
  { city: 'Bracknell', country: 'United Kingdom', status: 'active' },
  { city: 'Basingstoke', country: 'United Kingdom', status: 'active' },
  { city: 'Orpington', country: 'United Kingdom', status: 'active' },
  { city: 'Worthing', country: 'United Kingdom', status: 'active' },
  { city: 'Hove', country: 'United Kingdom', status: 'active' },
  { city: 'Hastings', country: 'United Kingdom', status: 'active' },
  { city: 'Hemel Hempstead', country: 'United Kingdom', status: 'active' },
  { city: 'Stevenage', country: 'United Kingdom', status: 'active' },
  { city: 'Hartlepool', country: 'United Kingdom', status: 'active' },
  { city: 'St Albans', country: 'United Kingdom', status: 'active' },
  { city: 'Wigan', country: 'United Kingdom', status: 'active' },
  { city: 'Wakefield', country: 'United Kingdom', status: 'active' },
  { city: 'Stockton-on-Tees', country: 'United Kingdom', status: 'active' }
];

// Remove duplicates
const uniqueCities = ukCities.filter((city, index, self) => 
  index === self.findIndex(c => c.city === city.city)
);

async function populateUKCities() {
  console.log('Starting to populate UK cities...');
  
  try {
    await runDatabaseOperation(async (dbOps) => {
      // Check connection first
      const isConnected = await dbOps.checkConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }
      
      // Get existing territories count
      const existingCount = await dbOps.getTerritoryCount();
      console.log(`Current territories in database: ${existingCount}`);
      
      // Insert all UK cities
      await dbOps.insertTerritories(ukCities);
      
      // Get new count
      const newCount = await dbOps.getTerritoryCount();
      console.log(`New territories count: ${newCount}`);
      console.log(`Added ${newCount - existingCount} new territories`);
      
      console.log('✅ Successfully populated UK cities in territories table!');
    });
    
  } catch (error) {
    console.error('Error in populateUKCities:', error);
  }
}

// Run the script
populateUKCities(); 