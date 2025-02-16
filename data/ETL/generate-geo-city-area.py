import geopandas as gpd
from shapely.geometry import Polygon

# Load the borough shapes from the GeoJSON file
boroughs = gpd.read_file('data/raw/borough-shapes.json')

# Make sure all data is in the same projection. 3857 is the projection used by Google Maps in meters.
boroughs = boroughs.to_crs(epsg=4326)

# Create a GeoDataFrame that represents the area of the city
city_geometry = gpd.GeoDataFrame(geometry=[Polygon(boroughs.unary_union)], crs='EPSG:3857')

# Save the city area to a GeoJSON file
city_geometry.to_file('data/curated/city-area.json', driver='GeoJSON')
