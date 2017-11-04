# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/xenial32"
  config.vm.network "forwarded_port", guest: 80, host: 5876
  config.vm.network "private_network", type: "dhcp"
  config.vm.provider "virtualbox" do |vb|
    vb.name = "Server gare territoriali OII"
    vb.memory = 2048
    vb.cpus = 2
  end

  config.vm.provision "shell", inline: "mkdir -p /app/zips"
  config.vm.provision "shell", inline: "mkdir -p /app/territoriali-frontend"
  config.vm.provision "shell", inline: "chown -R ubuntu:ubuntu /app"
  config.vm.provision "file", source: "territoriali-frontend/build",
                              destination: "/app/territoriali-frontend/build"
  config.vm.provision "file", source: "territoriali-backend",
                              destination: "/app/territoriali-backend"
  config.vm.provision "file", source: "nginx-example.conf",
                              destination: "/app/nginx.conf"
  config.vm.provision "file", source: "contest.zip",
                              destination: "/app/zips/contest.zip"
  config.vm.provision "file", source: "config.yaml",
                              destination: "/app/config.yaml"
  config.vm.provision "file", source: "territoriali-backend.service",
                              destination: "/app/territoriali-backend.service"
  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -yy python3 nginx python3-pip
    systemctl stop nginx
    mv /app/nginx.conf /etc/nginx/nginx.conf
    mv /app/territoriali-backend.service /etc/systemd/system/territoriali-backend.service
    cd /app/territoriali-backend
    pip3 install -r requirements.txt
    python3 setup.py install
    systemctl enable territoriali-backend.service
    systemctl enable nginx.service
    systemctl start nginx.service
    systemctl start territoriali-backend.service
  SHELL
end
