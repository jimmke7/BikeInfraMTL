import geopandas as gpd

# Load the GeoJSON file into a GeoDataFrame
gdf = gpd.read_file("data/bikelane-infra.json")

# Display the first few rows of the data
print("\nFirst few rows of data:")
print(gdf.head())

# Check for missing values
print("\nMissing values")
print(gdf.isnull().sum())

# Check the dataset's CRS (Coordinate Reference System)
print("\nCoordinate Reference System:")
print(gdf.crs)


import matplotlib.pyplot as plt

# Plot all bike lanes
ax = gdf.plot(figsize=(10, 10), color='lightblue', edgecolor='black', linewidth=2)
plt.title("Réseau Cyclable - Bike Lanes")

# Filter by type of bike lane
lane_type = "Piste cyclable en site propre"
filtered_gdf = gdf[gdf["TYPE_VOIE_DESC"] == lane_type]

# Overlay the filtered bike lanes
filtered_gdf.plot(ax=ax, color='green', edgecolor='black', linewidth=2)
plt.show()


from shapely.geometry import Point

# Create a point (e.g., Montreal's city center)
city_center = Point(-73.5673, 45.5017)

# Calculate the distance from the city center to each bike lane
gdf['distance_to_center'] = gdf.geometry.distance(city_center)

# Find the closest bike lane
closest_bike_lane = gdf.loc[gdf['distance_to_center'].idxmin()]
print(closest_bike_lane)



