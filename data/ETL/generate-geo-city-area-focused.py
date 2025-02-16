import geopandas as gpd
from shapely.geometry import Polygon
import matplotlib.pyplot as plt

# Load the borough shapes from the GeoJSON file
boroughs = gpd.read_file('data/raw/borough-shapes.json')

# Convert the borough shapes to the EPSG:3857 projection
boroughs = boroughs.to_crs(epsg=4326)

# filter the boroughs to focus on based on CODEID
focus_boroughs = boroughs[boroughs['CODEID'].isin([6, 12, 13, 14, 15, 16, 18, 19, 20, 22, 23])]

# Create a GeoDataFrame that represents the area of the city
city_geometry = gpd.GeoDataFrame(geometry=[Polygon(focus_boroughs.unary_union)], crs='EPSG:3857')

# Save the city area to a GeoJSON file
city_geometry.to_file('data/curated/city-area-focus.json', driver='GeoJSON')


# Plot all focus boroughs
fig, ax = plt.subplots(1, 1, figsize=(15, 15))

# Plot the focus boroughs
focus_boroughs.plot(ax=ax, color='lightblue', edgecolor='black', linewidth=2)

# Add a title
plt.title('Focus Boroughs in Montreal')

# Show the plot
plt.show()
