import flwr as fl

def main():
    print("Starting Flower Server on localhost:8080...")
    fl.server.start_server(
        server_address="localhost:8080",
        config=fl.server.ServerConfig(num_rounds=3),
    )

if __name__ == "__main__":
    main()

