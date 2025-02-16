import pandas as pd
import geopandas as gpd

# Load the bixi stations data
bixi_stations = gpd.read_file('data/curated/bixi-stations.json')

# Filter stations that are within the city area
bixi_stations = bixi_stations[bixi_stations['WITHIN_CITY_AREA']]

# Load the bixi trips data of 2024
bixi_trips = pd.read_csv('data/raw/bixi/bixi-2024.csv')

# Filter bixi data to only include stations that are within the city area
bixi_trips = bixi_trips[bixi_trips['STARTSTATIONNAME'].isin(bixi_stations['STATIONNAME'])]
bixi_trips = bixi_trips[bixi_trips['ENDSTATIONNAME'].isin(bixi_stations['STATIONNAME'])]

# Transform STARTTIMEMS and ENDTIMEMS to time of day rounded down to hours and minutes
bixi_trips['STARTTIME'] = pd.to_datetime(bixi_trips['STARTTIMEMS'], unit='ms').dt.floor('min').dt.time
bixi_trips['ENDTIME'] = pd.to_datetime(bixi_trips['ENDTIMEMS'], unit='ms').dt.floor('min').dt.time


# Round it down to a 10 minute interval
bixi_trips['STARTTIMEINTERVAL'] = bixi_trips['STARTTIME'].apply(lambda x: x.replace(minute=x.minute//10*10))
bixi_trips['ENDTIMEINTERVAL'] = bixi_trips['ENDTIME'].apply(lambda x: x.replace(minute=x.minute//10*10))


# group by start statation and start time interval and count the number of trips
bixi_starttrips_grouped = bixi_trips.groupby(['STARTSTATIONNAME', 'STARTTIMEINTERVAL']).size().reset_index(name='STARTCOUNT')

# group by end statation and end time interval and count the number of trips
bixi_endtrips_grouped = bixi_trips.groupby(['ENDSTATIONNAME', 'ENDTIMEINTERVAL']).size().reset_index(name='ENDCOUNT')

# Merge the two dataframes
bixi_trips_grouped = bixi_starttrips_grouped.merge(bixi_endtrips_grouped, left_on=['STARTSTATIONNAME', 'STARTTIMEINTERVAL'], right_on=['ENDSTATIONNAME', 'ENDTIMEINTERVAL'])

# Only keep 1 of the station name columns and time interval columns and keep the count columns
bixi_trips_grouped = bixi_trips_grouped[['STARTSTATIONNAME', 'STARTTIMEINTERVAL', 'STARTCOUNT', 'ENDCOUNT']]
bixi_trips_grouped.columns = ['STATIONNAME', 'TIMEINTERVAL', 'STARTCOUNT', 'ENDCOUNT']


# Create a new column that is the difference between the start count and the end count
bixi_trips_grouped['DELTACOUNT'] = bixi_trips_grouped['STARTCOUNT'] - bixi_trips_grouped['ENDCOUNT']


# Merge the bixi stations data with the bixi trips data
bixi_stations_interval_counts = bixi_stations.merge(bixi_trips_grouped, on='STATIONNAME', how='left')


# Save the data as bixi-stations-interval-counts.json
bixi_stations_interval_counts.to_file('data/curated/bixi-stations-interval-counts.json', driver='GeoJSON')

# Print that the data has been saved
print('Data saved as data/curated/bixi-stations-interval-counts.json')

