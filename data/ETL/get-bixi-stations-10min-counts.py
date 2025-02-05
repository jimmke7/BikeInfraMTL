import pandas as pd
import geopandas as gpd

# Load the bixi stations data
bixi_stations = gpd.read_file('data/curated/bixi-stations.json')

# Filter stations that are within the city area
bixi_stations = bixi_stations[bixi_stations['WITHIN_CITY_AREA']]

# Load bixi data
bixi_data = pd.read_csv('data/raw/bixi/bixi-2024.csv')

# Filter bixi data to only include stations that are within the city area
bixi_data = bixi_data[bixi_data['STARTSTATIONNAME'].isin(bixi_stations['STATIONNAME'])]
bixi_data = bixi_data[bixi_data['ENDSTATIONNAME'].isin(bixi_stations['STATIONNAME'])]

# Transform STARTTIMEMS and ENDTIMEMS into datetime
bixi_data['STARTTIME'] = pd.to_datetime(bixi_data['STARTTIMEMS'], unit='ms')
bixi_data['ENDTIME'] = pd.to_datetime(bixi_data['ENDTIMEMS'], unit='ms')

# Get hour of day and round to 10 minutes
bixi_data['STARTTIME10'] = bixi_data['STARTTIME'].dt.floor('10min')
bixi_data['ENDTIME10'] = bixi_data['ENDTIME'].dt.floor('10min')

# Generate 10 minute intervals between 0 and 24 hours
time_intervals = pd.date_range('2024-01-01', periods=144, freq='10min').time

# Create a dataframe with all possible combinations of stations and time intervals
stations_time_intervals = pd.MultiIndex.from_product(
    [bixi_stations['STATIONNAME'], time_intervals], names=['STATIONNAME', 'TIME']
).to_frame(index=False)

# Convert 'TIME' column to datetime
stations_time_intervals['TIME'] = pd.to_datetime(stations_time_intervals['TIME'].astype(str), format='%H:%M:%S')

# Add station coordinates to the dataframe
stations_time_intervals = stations_time_intervals.merge(
    bixi_stations[['STATIONNAME', 'STATIONLATITUDE', 'STATIONLONGITUDE', 'geometry']],
    on='STATIONNAME', how='left'
)

# Add start and end counts to the stations_time_intervals dataframe
start_counts = bixi_data.groupby(['STARTSTATIONNAME', 'STARTTIME10']).size().reset_index(name='STARTCOUNT')
end_counts = bixi_data.groupby(['ENDSTATIONNAME', 'ENDTIME10']).size().reset_index(name='ENDCOUNT')

stations_time_intervals = stations_time_intervals.merge(
    start_counts, left_on=['STATIONNAME', 'TIME'], right_on=['STARTSTATIONNAME', 'STARTTIME10'], how='left'
).merge(
    end_counts, left_on=['STATIONNAME', 'TIME'], right_on=['ENDSTATIONNAME', 'ENDTIME10'], how='left'
)

# Fill NaN values with 0
stations_time_intervals = stations_time_intervals.fillna(0).infer_objects(copy=False)

# Drop unnecessary columns
stations_time_intervals = stations_time_intervals.drop(columns=['STARTSTATIONNAME', 'STARTTIME10', 'ENDSTATIONNAME', 'ENDTIME10'])

# Delete rows with invalid station names
stations_time_intervals = stations_time_intervals[stations_time_intervals['STATIONNAME'] != 0]

# Reset index
stations_time_intervals = stations_time_intervals.reset_index(drop=True)

print(stations_time_intervals.head())
