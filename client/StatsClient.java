import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketException;
import java.net.UnknownHostException;

public class StatsClient {
    private DatagramSocket sock;
    private InetAddress statsHost;
    private int statsPort;
    
    public StatsClient(String host, int port) {
        try {
            this.statsHost = InetAddress.getByName(host);
        } catch (UnknownHostException e1) {
            e1.printStackTrace();
        }
        this.statsPort = port;
        try {
            sock = new DatagramSocket();
        } catch (SocketException e) {
            e.printStackTrace();
        }
    }
    
    public void reportCount(String key, String host, long count) {
        String msg = new StringBuilder(key).append("|").append(host).append("|").append(count).append("|").append("c").toString();
        sendToServer(msg);
    }
    
    public void incrementCount(String key, String host) {
        reportCount(key, host, 1);
    }
    
    public void decrementCount(String key, String host) {
        reportCount(key, host, -1);
    }
    
    public void reportTime(String key, long time, String host) {
        String msg = new StringBuilder(key).append("|").append(host).append("|").append(time).append("|").append("t").toString();
        sendToServer(msg);
    }


    private void sendToServer(String msg) {
        try {
            byte[] buf = msg.getBytes("utf-8");
            sock.send(new DatagramPacket(buf, buf.length, statsHost, statsPort));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

