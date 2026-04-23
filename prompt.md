Buatkan dockerfile dan docker-compose-frontend untuk project frontend ini ya:
Aku deploy menggunakan vps ubuntu dengan pengaturan versi docker sebelunya itu seperti ini:

sindi@server-web:~$ docker ps
CONTAINER ID   IMAGE                             COMMAND                  CREATED        STATUS        PORTS                                                                                  NAMES
63b110e411b0   dimaspmna/fe-oses-prod:2.2.6      "/docker-entrypoint.…"   2 months ago   Up 2 months   80/tcp                                                                                 fe-oses
18d703f236ab   jc21/nginx-proxy-manager:latest   "/init"                  2 months ago   Up 2 months   0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 81/tcp   nginx-proxy-manager
675678dd8187   dimaspmna/vrp-oses:2.0.6          "./venv/bin/uvicorn …"   2 months ago   Up 2 months   4000/tcp                                                                               vrp-oses
2934e77efee5   dimaspmna/be-oses:2.1.1           "docker-entrypoint.s…"   2 months ago   Up 2 months   5000/tcp                                                                               be-oses
c29507792254   mysql:8.0                         "docker-entrypoint.s…"   2 months ago   Up 2 months   3306/tcp, 33060/tcp                                                                    db-oses
464ec0bb3902   dimaspmna/pwanotif-oses:1.0.0     "docker-entrypoint.s…"   2 months ago   Up 2 months   5001/tcp                                                                               pwanotif-oses
a58f990f96db   dimaspmna/pwa-oses:2.6.2          "docker-entrypoint.s…"   2 months ago   Up 2 months   5173/tcp   


frontend itu berjalan di port 80 sebagai production

pengaturan docker networknya:
sindi@server-web:~$ docker network inspect oses-network
[
    {
        "Name": "oses-network",
        "Id": "484e5dee0d895fa435c0c66a9d4c738fbe39261afa2cfef60fb09ee4bdc02671",
        "Created": "2026-01-14T03:02:52.535832445Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv4": true,
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "IPRange": "",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Options": {},
        "Labels": {},
        "Containers": {
            "12d14974b114b186eb5655b31993b4d511f0ccf31ecca94cad14979f6b50b52a": {
                "Name": "pma-oses",
                "EndpointID": "0a5bef36b91703d0d420c899e1c72d1895d6e670df01817233a5e729cf3662c8",
                "MacAddress": "42:cc:ad:53:34:76",
                "IPv4Address": "172.18.0.7/16",
                "IPv6Address": ""
            },
            "18d703f236ab5981ad1d6ae8365b9e8507eea10007bfedca5c55e05ecff89b6e": {
                "Name": "nginx-proxy-manager",
                "EndpointID": "1280071df5e7310d7c0f76e033870cefa41818dd6f9d25584f2c82133c251bb4",
                "MacAddress": "22:a7:28:62:94:f3",
                "IPv4Address": "172.18.0.4/16",
                "IPv6Address": ""
            },
            "2934e77efee5369d95dea1aaabb8aecef3c11761c0da5cfc1fa5e6187df4a5c2": {
                "Name": "be-oses",
                "EndpointID": "862487d52eccd0ca44ca7dfb60dfa9cd8159843389ac38cc378b250a2f6c76f8",
                "MacAddress": "22:ba:ed:09:2c:54",
                "IPv4Address": "172.18.0.8/16",
                "IPv6Address": ""
            },
            "464ec0bb3902dde33360e88deab5172cf244b94f3e1d1877649bf00020fd87da": {
                "Name": "pwanotif-oses",
                "EndpointID": "295486e7fb4dce22159e9e8cf4aa4845df607723e11c490f9ecaef76f515a32f",
                "MacAddress": "96:27:e0:13:92:50",
                "IPv4Address": "172.18.0.6/16",
                "IPv6Address": ""
            },
            "63b110e411b0370e44806cb1d41e9c030e3117b1a9baebc52ff9bdb104711994": {
                "Name": "fe-oses",
                "EndpointID": "0728b0c0c37a686d0c4684ecfbcccaa5cefd65f8eceae09c7781d15b28395cae",
                "MacAddress": "b2:92:a9:27:f6:12",
                "IPv4Address": "172.18.0.2/16",
                "IPv6Address": ""
            },
            "675678dd8187b4410f2c89802a6e1e757157bdb592bcbbaba8bd23dad5c996e1": {
                "Name": "vrp-oses",
                "EndpointID": "4f107210c6195026ec9003a7156a78c1ed9c71108516fc01ddbdc491f2048390",
                "MacAddress": "3e:ca:39:4f:14:79",
                "IPv4Address": "172.18.0.9/16",
                "IPv6Address": ""
            },
            "a58f990f96db4cdeffa3e5551d093fa793282468dd063a7bf152b05cee5b96d7": {
                "Name": "pwa-oses",
                "EndpointID": "b14dd4d9fbe8fede4cc00205d8ae180665720b7d81a50f70fddb187bc385f5d5",
                "MacAddress": "2a:12:33:dc:a6:a7",
                "IPv4Address": "172.18.0.3/16",
                "IPv6Address": ""
            },
            "c295077922540b69818a0ef59c043f3824d45256d23522294170874adead7786": {
                "Name": "db-oses",
                "EndpointID": "761800a54c527cb393fda9a8918b33db64355a5a2c9bcf0fb336ec75dcfec927",
                "MacAddress": "c6:bb:be:eb:30:8a",
                "IPv4Address": "172.18.0.5/16",
                "IPv6Address": ""
            }
        },
        "Status": {
            "IPAM": {
                "Subnets": {
                    "172.18.0.0/16": {
                        "IPsInUse": 11,
                        "DynamicIPsAvailable": 65525
                    }
                }
            }
        }
    }
]
