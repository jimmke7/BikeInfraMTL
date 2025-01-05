import geopandas as gpd
import matplotlib.pyplot as plt

# Load the borough shapes data
borough_shapes = gpd.read_file('data/raw/borough-shapes.json')

# Load the street data (e.g., bike lanes)
street_data = gpd.read_file('data/raw/bikelane-infra.json')

# Reproject both GeoDataFrames to a CRS that uses meters (e.g., EPSG:32618 for UTM zone 18N)
borough_shapes = borough_shapes.to_crs(epsg=32618)
street_data = street_data.to_crs(epsg=32618)

# Perform a spatial join to associate streets with boroughs
streets_in_boroughs = gpd.sjoin(street_data, borough_shapes, how='inner', predicate='intersects')

# Calculate the length of each street segment in kilometers
streets_in_boroughs['length_km'] = (streets_in_boroughs.geometry.length / 1000).round(1)

# Sum the lengths of the streets within each borough
borough_street_lengths = streets_in_boroughs.groupby('NOM_OFFICIEL')['length_km'].sum().reset_index()

# Print the result
print(borough_street_lengths)

# Optionally, save the result to a CSV file
borough_street_lengths.to_csv('data/curated/borough_street_lengths.csv', index=False)

# def plot_borough(borough_name):
#     # Filter the GeoDataFrame for the selected borough
#     filtered_borough_shapes = borough_shapes[borough_shapes['NOM_OFFICIEL'] == borough_name]
#     filtered_streets_in_boroughs = streets_in_boroughs[streets_in_boroughs['NOM_OFFICIEL'] == borough_name]

#     # Plot the borough shape
#     ax = filtered_borough_shapes.plot(figsize=(10, 10), color='lightblue', edgecolor='black', linewidth=2)
#     plt.title(f"Bike Lanes in {borough_name}")

#     # Plot the streets within the borough
#     filtered_streets_in_boroughs.plot(ax=ax, color='red', linewidth=2, label='Bike Lanes')

#     plt.legend()
#     plt.show()

# # Example usage: Plot data for a specific borough
# plot_borough('Rivière-des-Prairies–Pointe-aux-Trembles')

# Plot all boroughs and color them based on the amount of bike lane kilometers
fig, ax = plt.subplots(1, 1, figsize=(15, 15))

# Merge the borough shapes with the street lengths data
borough_shapes_with_lengths = borough_shapes.merge(borough_street_lengths, on='NOM_OFFICIEL')

# Plot the boroughs, coloring them based on the length of bike lanes
borough_shapes_with_lengths.plot(column='length_km', ax=ax, legend=True, cmap='Blues', edgecolor='black', linewidth=1)

# Plot the streets within the boroughs
streets_in_boroughs.plot(ax=ax, color='#3BBA9C', linewidth=1, label='Bike Lanes')

# Add a title
plt.title('Bike Lanes in Montreal Boroughs')

# Show the plot
plt.show()