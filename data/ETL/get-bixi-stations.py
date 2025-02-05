import pandas as pd
import geopandas as gpd

# Load a bixi data file
bixi = pd.read_csv('data/raw/bixi/bixi-2024.csv')

# Retrieve unique start locations and keep first combination of coordinates
bixi_stations = bixi[['STARTSTATIONNAME']].drop_duplicates().rename(columns={'STARTSTATIONNAME': 'STATIONNAME'})
station_coords = bixi.groupby('STARTSTATIONNAME').first()[['STARTSTATIONLATITUDE', 'STARTSTATIONLONGITUDE']].reset_index()
bixi_stations = bixi_stations.merge(station_coords, left_on='STATIONNAME', right_on='STARTSTATIONNAME', how='left').drop(columns='STARTSTATIONNAME').rename(columns={'STARTSTATIONLATITUDE': 'STATIONLATITUDE', 'STARTSTATIONLONGITUDE': 'STATIONLONGITUDE'})

# Create a GeoDataFrame from the bixi stations
gdf_bixi_stations = gpd.GeoDataFrame(
    bixi_stations, 
    geometry=gpd.points_from_xy(bixi_stations['STATIONLONGITUDE'], bixi_stations['STATIONLATITUDE']),
    crs='EPSG:4326'  # Use EPSG:4326 for latitude and longitude coordinates
)

# Filter out invalid geometries
gdf_bixi_stations = gdf_bixi_stations[gdf_bixi_stations.geometry.is_empty == False]

# Filter out invalid points with coordinates (0, 0)
gdf_bixi_stations = gdf_bixi_stations[(gdf_bixi_stations['STATIONLATITUDE'] != 0) & (gdf_bixi_stations['STATIONLONGITUDE'] != 0)]


# Load city area
city_area = gpd.read_file('data/curated/city-area.json')

# Make sure the city area is in the same projection as the bixi stations
city_area = city_area.to_crs('EPSG:3857')
gdf_bixi_stations = gdf_bixi_stations.to_crs('EPSG:3857')

# Create a column that indicates if the station is within the city area
gdf_bixi_stations['WITHIN_CITY_AREA'] = gdf_bixi_stations.within(city_area.geometry.iloc[0])

# Save the bixi stations to a GeoJSON file
gdf_bixi_stations.to_file('data/curated/bixi-stations.json', driver='GeoJSON')