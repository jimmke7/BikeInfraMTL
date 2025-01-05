import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import matplotlib.pyplot as plt

# Load the CSV files into DataFrames
file_path_counts = 'data/raw/bike-counts.csv'
bike_counts_df = pd.read_csv(file_path_counts)

file_path_locations = 'data/raw/bike-counts-locations.csv'
bike_counts_locations_df = pd.read_csv(file_path_locations)

# Merge the DataFrames on the common column (e.g., 'id_compteur' in bike_counts_df and 'ID' in bike_counts_locations_df)
merged_df = pd.merge(bike_counts_df, bike_counts_locations_df, left_on='id_compteur', right_on='ID')

# Group by the location and get the total count per location, including Latitude and Longitude
total_counts_per_location = merged_df.groupby(['Nom', 'Latitude', 'Longitude'])['nb_passages'].sum().reset_index()

# Normalize the counts to a range between 5 and 50 for marker sizes
min_marker_size = 5
max_marker_size = 100
min_count = total_counts_per_location['nb_passages'].min()
max_count = total_counts_per_location['nb_passages'].max()

total_counts_per_location['marker_size'] = total_counts_per_location['nb_passages'].apply(
    lambda x: min_marker_size + (max_marker_size - min_marker_size) * (x - min_count) / (max_count - min_count)
)

# Create a GeoDataFrame with Point geometries for each location
geometry = [Point(xy) for xy in zip(total_counts_per_location['Longitude'], total_counts_per_location['Latitude'])]
geo_df = gpd.GeoDataFrame(total_counts_per_location, geometry=geometry)

# Load the GeoJSON file into a GeoDataFrame
gdf = gpd.read_file("data/raw/bikelane-infra.json")

# Plot all bike lanes
ax = gdf.plot(figsize=(10, 10), color='lightblue', edgecolor='black', linewidth=2)
plt.title("Réseau Cyclable - Bike Lanes")

# Plot the locations with circles on top of the bike lanes, using the normalized marker sizes
geo_df.plot(ax=ax, marker='o', color='red', markersize=geo_df['marker_size'], label='Bike Count Locations', zorder=5)

# Set the x and y limits to zoom into a specific part of the map
ax.set_xlim([-73.7, -73.5])  # Adjust these values to your desired longitude range
ax.set_ylim([45.46, 45.58])  # Adjust these values to your desired latitude range

plt.legend()
plt.show()