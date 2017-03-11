#seting up env
command -v wget >/dev/null 2>&1 || { sudo apt-get update && sudo apt-get install wget -y; }
command -v node >/dev/null 2>&1 || { curl -sL https://deb.nodesource.com/setup_5.x |  bash - &&  apt-get install -qq -y nodejs; }
command -v docker >/dev/null 2>&1 || { wget -qO- https://get.docker.com/ |  sh && echo 'DOCKER_OPTS="--storage-driver=devicemapper"' |  tee --append /etc/default/docker >/dev/null &&  service docker start ||  service docker restart; }
command -v meteor >/dev/null 2>&1 || { curl https://install.meteor.com/ | sh; }
command -v parallel >/dev/null 2>&1 || { sudo apt-get -qq -y install parallel; }
command -v mkfs.xfs >/dev/null 2>&1 || { sudo apt-get -qq -y install xfsprogs; }

export MUP_DIR=$PWD
{
rm -rf /tmp/tests
mkdir /tmp/tests
cp -rf $MUP_DIR/tests /tmp
cd /tmp/tests/
rm -rf new*
# ssh-keygen -f new -t rsa -N ''
# chmod 600 new.pub
# sudo chown root:root new.pub
eval `ssh-agent`
docker rm -f $( docker ps -a -q --filter=ancestor=mup-tests-server ) 2>/dev/null
if [[ -z $( docker images -aq mup-tests-server) ]]; then
     docker build -t mup-tests-server .
fi

cd $MUP_DIR
rm -rf ./tests/ssh
mkdir ./tests/ssh
cd ./tests/ssh
ssh-keygen -f new -t rsa -N ''
chmod 600 new.pub
sudo chown root:root new.pub

cd $MUP_DIR

npm run prepublish
 npm link
} > /dev/null