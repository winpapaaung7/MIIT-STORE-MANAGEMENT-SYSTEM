class Accessory {
  const Accessory({
    required this.id,
    required this.itemName,
    required this.status,
    required this.currentDepartment,
    required this.currentRoom,
    required this.remark,
  });

  final String id;
  final String itemName;
  final String status;
  final String currentDepartment;
  final String currentRoom;
  final String remark;

  factory Accessory.fromJson(Map<String, dynamic> json) {
    return Accessory(
      id: json['id'].toString(),
      itemName: json['item_name'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currentDepartment: json['department'] as String? ?? '',
      currentRoom: json['room'] as String? ?? '',
      remark: json['remark'] as String? ?? '',
    );
  }
}
